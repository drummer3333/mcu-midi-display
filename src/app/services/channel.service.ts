import { Observable, of, map, switchMap, share } from 'rxjs';
import { OscChannelStrip, OscService } from './osc.service';
import { Injectable, Pipe } from '@angular/core';
import { MidiService, MidiChannelStrip, MidiContext } from './midi.service';

export type ChannelStrip = MidiChannelStrip & OscChannelStrip;



@Injectable({
  providedIn: 'root'
})
export class ChannelService {

    constructor(private midiService: MidiService, private oscService: OscService) {
    }


    getChannel(index: number): Observable<ChannelStrip> {
        return this.enrichedChannel(ctx => ctx.getChannel(index));
    }
    getMainChannel(): Observable<ChannelStrip> {
        return this.enrichedChannel(ctx => ctx.getMainChannel());
    }


    enrichedChannel(selector: ((ctx: MidiContext) => MidiChannelStrip)): Observable<ChannelStrip> {
        return this.midiService.midiContext$.pipe(
            map(selector),
            map(midiChannelStrip => this.enrichMidi(midiChannelStrip))
        )
    }

    enrichMidi(midiChannelStrip: MidiChannelStrip): ChannelStrip {
        const osc = midiChannelStrip.lcd1$.pipe(
            map(name => this.oscService.getChannelByName(name, midiChannelStrip)),
            share()
        );

        return {
            ...midiChannelStrip,
            name$: osc.pipe(switchMap(c => c.name$)),
            color$: osc.pipe(switchMap(c => c.color$)),
            index$: osc.pipe(switchMap(c => c.index$)),
            lvl$: osc.pipe(switchMap(c => c.lvl$)),
        }
    }
}

