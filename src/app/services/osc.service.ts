import { Observable, fromEvent, of, map, tap, shareReplay, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';
import * as OSC from 'osc-js';

export interface OscChannelStrip {
    name: string;
    index: number;
    name$: Observable<string>;
    color$: Observable<string>;
}

interface OscChannelStripInternal extends OscChannelStrip {
    nameSub: ReplaySubject<string>;
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
const EMPTY_CHANNEL: OscChannelStrip  = {
    name: '',
    name$: of(''),
    color$: of(''),
    index: -1,
}

@Injectable({
  providedIn: 'root'
})
export class OscService {
    private osc = new OSC({
        plugin: new OSC.WebsocketClientPlugin({port: 8888})
    });


    private channelMapByName = new Map<string, number>();
    private channels = new Array<OscChannelStripInternal>();

    constructor() {
        this.osc.on('error', (message: Message) => {
             console.error('OSC error', message);
        });

        this.initChannels();

        this.initChannelNameMap();

        this.osc.on('open', () => {
            for (let index = 0; index <= MAX_CHANNELS; index++) {
                this.osc.send( new OSC.Message(`/con/v/ch.${index}.cfg.name`))
                this.osc.send( new OSC.Message(`/con/v/ch.${index}.cfg.color`))
            }
        });
        this.osc.open();
    }

    initChannels() {
        for (let index = 0; index <= MAX_CHANNELS; index++) {
            const nameSub = new ReplaySubject<string>(1);
            this.channels[index] = {
                name: '',
                name$: nameSub,
                color$: this.getChannelColor(index),
                nameSub,
                index
            }
        }
    }

    initChannelNameMap() {
        this.osc.on('/con/v/ch.*.cfg.name', (msg: Message) => {
            const number = this.addressToChannelNumber(msg.address);
            let fullname = (msg.args[0] as string);
            if (!fullname) {
                fullname = this.genericName(number);
            }
            const name = fullname.substring(0, 7);

            const oldName = this.channels[number].name;
            if (oldName) {
                this.channelMapByName.delete(oldName);
            }

            this.channelMapByName.set(name, number);
            this.channels[number].name = name;
            this.channels[number].nameSub.next(fullname);
        })
    }

    addressToChannelNumber(addr: string): number {
        const afterFirstDot = 10;
        const secondDot = addr.indexOf('.', afterFirstDot );
        const channelNumber = addr.substring(afterFirstDot, secondDot);
        return parseInt(channelNumber);
    }

    getChannelByName(name: string): OscChannelStrip {
        const channelNr = this.channelMapByName.get(name.trim());

        if (channelNr == undefined || channelNr > MAX_CHANNELS || channelNr < 0) {
            return EMPTY_CHANNEL;
        }


        return this.channels[channelNr]
    }

    getChannelValue(channel: number, address: string): Observable<Message> {
        const path = `/con/v/ch.${channel}.${address}`;
        const value = new ReplaySubject<Message>(1);

        this.osc.on(path, (msg: Message) => {
            value.next(msg)
        })

        return value;
    }

    getChannelValueString(channel: number, address: string): Observable<string> {
        return this.getChannelValue(channel, address).pipe(
            map(msg => msg.args[0] as string),
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
}
