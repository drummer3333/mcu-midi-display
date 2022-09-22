import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject, Subject, Observable, of, startWith, share, map, filter, tap, shareReplay, merge } from 'rxjs';
import { ControlChangeMessageEvent, Input, MessageEvent, Output, WebMidi } from 'webmidi';
import { arraysEqual } from '../helper/helper';
import { initLcd, initLcdColor, initRotary, RotaryState } from './midi-init';

const FADERBOX_NAME = "Platform M V2.01";
const BRIDGE_TO_MIXINGSTATION = ["toMixing1", "toMixing2"];
const BRIDGE_FROM_MIXINGSTATION = ["fromMixing1", "fromMixing2"];



@Injectable({providedIn: 'root'})
export class MidiService {
    midiContext$ = new ReplaySubject<MidiContext>(1);

    constructor(
        private ngZone: NgZone
    ) {
        WebMidi
        .enable({sysex:true})
        .then(_ => this.onMidiEnable())
        .catch(err => alert(err));
    }
    onMidiEnable(): any {
        console.log(WebMidi.outputs);
        const toFaderbox = WebMidi.getOutputByName(FADERBOX_NAME);
        const toMixingStation = BRIDGE_TO_MIXINGSTATION.map(name => WebMidi.getOutputByName(name));

        const fromFaderbox = WebMidi.getInputByName(FADERBOX_NAME);
        const fromMixingStation = BRIDGE_FROM_MIXINGSTATION.map(name => WebMidi.getInputByName(name));

        this.ngZone.run(() => this.midiContext$.next(new MidiContext(this.ngZone, toFaderbox, fromFaderbox, toMixingStation,  fromMixingStation)))

    }

}

export interface MidiChannelStrip {
    lcd1$: Observable<string>;
    lcd2$: Observable<string>;
    // color$: Observable<string>;
    rotary$: Observable<RotaryState>;
}


export class MidiContext {
    private sysexMcu$: Observable<MessageEvent>[];
    private controlchange$: Observable<ControlChangeMessageEvent>[];

    constructor(
        private ngZone: NgZone,
        private toFaderbox: Output,
        private fromFaderbox: Input,
        private toMixingStation: Output[],
        private fromMixingStation: Input[]
    ) {
        console.log(toFaderbox,
            fromFaderbox,
            toMixingStation,
            fromMixingStation)
        fromFaderbox.addForwarder(toMixingStation[0]);
        fromMixingStation[0].addForwarder(toFaderbox);

        // fromFaderbox.addListener('midimessage', e => {
        //     console.log('midimessage', e.message.data.map( n => n.toString(16)).join(" ") + " - " + e.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join(""), e);
        // });

        // fromMixingStation.addListener('midimessage', e => {
        //     if ( (e.message.data[0] == 0xd0 )) { //&& (e.message.data[1] == 0xd30 || e.message.data[1] == 0x40)) {
        //         return
        //     }
        //     if (e.message.data[0] == 0xf0 && (e.message.data[5] == 0x72 || e.message.data[5] == 0x12)) {
        //         return
        //     }
        //     console.log('midimessage', e.message.data.map( n => n.toString(16)).join(" ") + " - " + e.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join(""), e);
        // });

        // fromMixingStation.addListener('noteon', e => {
        //     console.log('noteon', e);

        // });
        // fromMixingStation.addListener('noteoff', e => {
        //     console.log('noteoff', e);

        // });
        this.controlchange$ =  fromMixingStation.map(input => {
            const subject = new Subject<ControlChangeMessageEvent>();
            input.addListener('controlchange', e => {
                this.ngZone.run(() => subject.next(e));
            });
            return subject
        });

            // console.log('midimessage', e.controller.number, e.message.data.map( n => n.toString(16)).join(" ") + " - " + e.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join(""), e);

        this.sysexMcu$ = fromMixingStation.map(input => {
            const subject = new Subject<MessageEvent>();
            input.addListener('sysex', e => {
                if (arraysEqual(e.message.data.slice(0, 4), [0xf0, 0x00, 0x00, 0x66])) {
                    this.ngZone.run(() =>subject.next(e));
                }
            });

            return subject
        })

        merge(...this.sysexMcu$).pipe(
            filter(e => e.message.data[5] !== 0x12 && e.message.data[5] !== 0x72)
        ).subscribe(x => console.log(x.message.data.map( n => n.toString(16)).join(" ") + " - " + x.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join("")) )

        // fromFaderbox.addListener('midimessage', e => {
        //     console.log('midimessage', e.message.data.map( n => n.toString(16)).join(" ") );
        // });
    }

    getChannel(index: number, controllerindex = 0): MidiChannelStrip {
        if (index > 7) {
            throw new Error("index must be between 0 and 7");
        }

        return {
            // color$: initLcdColor(this.sysexMcu$[controllerindex], index),
            rotary$: initRotary(this.controlchange$[controllerindex], index),
            lcd1$: initLcd(this.sysexMcu$[controllerindex], index, 0),
            lcd2$: initLcd(this.sysexMcu$[controllerindex], index, 1),
        }
    }

    getMainChannel(): MidiChannelStrip {
        return this.getChannel(0, 1);
    }


}



// tap(x => console.log(x.message.data.map( n => n.toString(16)).join(" "))),
// tap(x => console.log(x)),
