import { Observable, of, map, switchMap, share } from 'rxjs';
import { OscChannelStrip, OscService } from './osc.service';
import { Injectable, Pipe } from '@angular/core';
import { MidiService, MidiChannelStrip, MidiContext } from './midi.service';

export type ChannelStrip =
    Pick<MidiChannelStrip, 'rotary$' | 'vu$' | 'lcd2$'> &
    OscChannelStrip &
    {
        sofLvl$: Observable<number>
        show$: Observable<boolean>
    };



@Injectable({
  providedIn: 'root'
})
export class ChannelService {
    public mainChannel$: Observable<ChannelStrip>;
    public sof$: Observable<number>;

    constructor(private midiService: MidiService, private oscService: OscService) {
        this.mainChannel$ = this.getMainChannel();
        this.sof$ = midiService.midiContext$.pipe(
            switchMap(ctx => ctx.getSof())
        )
    }


    getChannel(index: number): Observable<ChannelStrip> {
        return this.enrichedChannel(ctx => ctx.getChannel(index), false, index);
    }

    private getMainChannel(): Observable<ChannelStrip> {
        return this.enrichedChannel(ctx => ctx.getMainChannel(), true, -1);
    }

    private enrichedChannel(selector: ((ctx: MidiContext) => MidiChannelStrip), main: boolean, index: number): Observable<ChannelStrip> {
        return this.midiService.midiContext$.pipe(
            map(selector),
            map(midiChannelStrip => this.enrichMidi(midiChannelStrip, main, index))
        )
    }

    private enrichMidi(midiChannelStrip: MidiChannelStrip, main: boolean, index: number): ChannelStrip {
        const osc = this.oscService.enhanceChannel(midiChannelStrip)

        return <ChannelStrip>{
            ...midiChannelStrip,
            ...osc,
            sofLvl$: this.getSofLvl(osc, main),
            show$: midiChannelStrip.lcd1$.pipe(map(l => !!l.trim()))
        };
    }



    getSofLvl(osc: OscChannelStrip, main: boolean): Observable<number> {
        if (main) {
            return osc.lvl$
        }

        return this.sof$.pipe(
            switchMap(sof => {
                console.log('sof', sof);
                if (sof < 0) {
                    return osc.lvl$
                } else if (sof < 10) {
                    return osc.sendLvl$[sof]
                } else {
                    return of() // TODO Gain
                }
            })
        );
    }
}

