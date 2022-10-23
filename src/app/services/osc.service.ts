import { MidiChannelStrip } from './midi.service';
import { Observable, of, map, ReplaySubject, Subject, combineLatest, switchMap, EMPTY, share, shareReplay } from 'rxjs';
import { Injectable } from '@angular/core';
import * as OSC from 'osc-js';

export interface OscChannelStrip {
    index$: Observable<number>;
    name$: Observable<string>;
    color$: Observable<string>;
    lvl$: Observable<number>;
    sendLvl$: Array<Observable<number>>;
    headAmp$: Observable<HeadAmpRange>;
}

export interface HeadAmpRange {
    low: number;
    high: number;
    value: number;
}

interface OscChannelStripInternal extends OscChannelStrip {
    name: string;
    color: number;
    index: number;
}


interface Message {
    offset: string;
    address: string;
    types: string;
    args: Array<any>;
}

const COLORS = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
]

const MAX_CHANNELS = 35;
const MAX_SENDS = 9;
const MAX_HEAD_AMP = 16;
const DEFAULT_HEAD_AMP = <HeadAmpRange>{high: 100, low: 0, value: -1}

@Injectable({
  providedIn: 'root'
})
export class OscService {
    private osc = new OSC({
        plugin: new OSC.WebsocketClientPlugin({port: 8888})
    });


    private channelMap = new Map<string, number>();
    private channelMap$ = new ReplaySubject<Map<string, number>>();
    private channels = new Array<OscChannelStripInternal>();
    private headAmp = new Array<Observable<HeadAmpRange>>()

    constructor() {
        this.osc.on('error', (message: Message) => {
             console.error('OSC error', message);
        });

        this.initHeadAmp();
        this.initChannels();
        this.initChannelNameMap();


        this.osc.on('open', () => {
            for (let index = 0; index <= MAX_CHANNELS; index++) {
                this.osc.send( new OSC.Message(`/con/v/ch.${index}.cfg.name`));
                this.osc.send( new OSC.Message(`/con/v/ch.${index}.cfg.color`));
                this.osc.send( new OSC.Message(`/con/v/ch.${index}.cfg.in.src`));
                this.osc.send( new OSC.Message(`/con/v/ch.${index}.mix.lvl`));
                for (let send = 0; send <= MAX_SENDS; send++) {
                    this.osc.send( new OSC.Message(`/con/v/ch.${index}.mix.sends.${send}.lvl`));
                }
            }

            for (let index = 0; index <= MAX_CHANNELS; index++) {
                this.osc.send( new OSC.Message(`/con/v/headamp.${index}.gain`));

            }
        });
        this.osc.open();
    }

    initHeadAmp() {
        for (let index = 0; index <= MAX_HEAD_AMP; index++) {
            const isAux = index === MAX_HEAD_AMP;
            this.headAmp[index] = this.getChannelValue(index, 'gain', 'headamp').pipe(
                map(msg => msg.args[0] as number),
                map(value => {
                    return <HeadAmpRange>{
                        low: -12,
                        high: isAux ? 20 : 60,
                        value
                    }
                })
            )
        }

        this.headAmp[MAX_HEAD_AMP + 1 ] = this.headAmp[MAX_HEAD_AMP]
    }

    initChannels() {
        for (let index = 0; index <= MAX_CHANNELS; index++) {
            const nameSub = new ReplaySubject<string>(1);
            this.channels[index] = {
                name: '',
                color: 100,
                name$: this.getChannelValueString(index, 'cfg.name'),
                color$: this.getChannelColor(index),
                index,
                index$: of(index),
                lvl$: this.getChannelValueNumber(index, 'mix.lvl'),
                sendLvl$: this.initChannelSendLvls(index),
                headAmp$: this.getHeadAmp(index)
            }
        }
    }

    getHeadAmp(index: number): Observable<HeadAmpRange> {
        if (index >= 0 && index <= 15) {
            return this.getChannelValueNumber(index, 'cfg.in.src').pipe(
                switchMap(src => {
                    if (src > 0 && src <= 18) {
                       return this.headAmp[src-1];
                    }

                    return of(DEFAULT_HEAD_AMP);
                })
            )
        } else if (index == 16) { // AUX
            return this.headAmp[17];
        }

        return of(DEFAULT_HEAD_AMP);
    }

    initChannelSendLvls(index: number): Observable<number>[] {
        const sends: Observable<number>[] = [];
        for (let send = 0; send <= MAX_SENDS; send++) {
            sends[send] = this.getChannelValueNumber(index, `mix.sends.${send}.lvl`);
        }

        return sends
    }

    initChannelNameMap() {
        this.osc.on('/con/v/ch.*.cfg.{name,color}', (msg: Message) => {
            const chNumber = this.addressToChannelNumber(msg.address);
            const channel = this.channels[chNumber];
            const oldMapIndex = this.toMapIndex(channel);

            if (msg.address.endsWith('name')) {
                let fullname = (msg.args[0] as string);
                if (!fullname) {
                    fullname = this.genericName(chNumber);
                }
                channel.name = fullname.substring(0, 7).trim();
            } else if (msg.address.endsWith('color')) {
                channel.color = (msg.args[0] as number);
            }

            if (oldMapIndex) {
                this.channelMap.delete(oldMapIndex);
            }

            const newMapIndex = this.toMapIndex(channel);
            this.channelMap.set(newMapIndex, chNumber);
            this.channelMap$.next(this.channelMap);
        });
    }

    toMapIndex(ch: Pick<OscChannelStripInternal, 'name' | 'color'>): string {
        return  `${ch.name}-${ch.color % 8}`;
    }

    addressToChannelNumber(addr: string): number {
        const afterFirstDot = 10;
        const secondDot = addr.indexOf('.', afterFirstDot );
        const channelNumber = addr.substring(afterFirstDot, secondDot);
        return parseInt(channelNumber);
    }

    enhanceChannel(midiChannelStrip: MidiChannelStrip): OscChannelStrip {
        const chan = combineLatest([ midiChannelStrip.lcd1$, midiChannelStrip.mColor$, this.channelMap$]).pipe(
            map(([name, color, channelMap]) => {
                const channelNr = channelMap.get(this.toMapIndex({name: name.trim(), color}));

                if (channelNr == undefined || channelNr > MAX_CHANNELS || channelNr < 0) {
                    return this.emptyChannel(name, midiChannelStrip);
                }

                return this.channels[channelNr];
            }),
            share()
        );

        return this.switchMapOscChannelItems(chan);
    }

    private switchMapOscChannelItems(chan: Observable<OscChannelStrip>) {
        return <OscChannelStrip>{
            name$: chan.pipe(switchMap(c => c.name$)),
            color$: chan.pipe(switchMap(c => c.color$), shareReplay(1)),
            index$: chan.pipe(switchMap(c => c.index$)),
            lvl$: chan.pipe(switchMap(c => c.lvl$)),
            headAmp$: chan.pipe(switchMap(c => c.headAmp$)),
            sendLvl$: this.switchMapSendLvl(chan)
        };
    }

    private switchMapSendLvl(chan: Observable<OscChannelStrip>): Array<Observable<number>> {
        const sendLvl: Array<Observable<number>> = [];
        for (let send = 0; send <= MAX_SENDS; send++) {
            sendLvl[send] = chan.pipe(switchMap(c => c.sendLvl$[send] || of()));
        }

        return sendLvl;
    }

    getChannelValue(channel: number | '*', address: string, baseAddresse = 'ch'): Observable<Message> {
        const path = `/con/v/${baseAddresse}.${channel}.${address}`;
        const value = new ReplaySubject<Message>(1);

        this.osc.on(path, (msg: Message) => {
            value.next(msg)
        });

        return value;
    }

    getChannelValueString(channel: number, address: string): Observable<string> {
        return this.getChannelValue(channel, address).pipe(
            map(msg => msg.args[0] as string),
        )
    }

    getChannelValueNumber(channel: number, address: string): Observable<number> {
        return this.getChannelValue(channel, address).pipe(
            map(msg => msg.args[0] as number),
        )
    }

    getChannelColor(channel: number): Observable<string> {
        return this.getChannelValue(channel, 'cfg.color').pipe(
            map(msg => {
                const v: number = msg.args[0];
                if (v < 8) {
                    return COLORS[v];
                }

                return COLORS[v - 8] + '-inv';
            }),
        )
    }

    genericName(number: number): string {
        if (number < 0) {
            return '';
        }
        if (number <= 15) {
            return 'CH ' + (number + 1).toString().padStart(2, '0');
        }
        if (number == 16) {
            return 'AuxIn 01';
        }
        if (number <= 20) {
            return 'FX ' + (number - 16);
        }
        if (number <= 26) {
            return 'Bus ' + (number - 20);
        }
        if (number <= 30) {
            return 'FxSnd ' + (number - 26);
        }
        if (number == 31) {
            return 'LR';
        }
        if (number <= 35) {
            return 'DCA ' + (number - 31);
        }

        return '';
    }

    emptyChannel(name: string, midiChannelStrip: MidiChannelStrip): OscChannelStrip {
        return {
            name$: of(name),
            color$: midiChannelStrip.mColor$.pipe(map(c => COLORS[c] || COLORS[0])),
            index$: of(-1),
            lvl$: of(NaN),
            headAmp$: of(DEFAULT_HEAD_AMP),
            sendLvl$: new Array(MAX_SENDS).fill(of())
        }
    }
}
