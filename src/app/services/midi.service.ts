import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject, Subject, Observable, of, startWith, share, map, filter, tap, shareReplay, merge } from 'rxjs';
import { ControlChangeMessageEvent, Input, Message, MessageEvent, Output, WebMidi } from 'webmidi';
import { arraysEqual } from '../helper/helper';
import { initLcd, initLcdColor, initRotary, initVU, RotaryState, VUState } from './midi-init';

const FADERBOX_NAME = "Platform M V2.01";
const ROTARYBOX_NAME = "X-TOUCH MINI";
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
        // console.log(WebMidi.outputs.map(o => o.name));


        this.ngZone.run(() => this.midiContext$.next(new MidiContext(this.ngZone)));
    }

}

export interface MidiChannelStrip {
    lcd1$: Observable<string>;
    lcd2$: Observable<string>;
    // color$: Observable<string>;
    rotary$: Observable<RotaryState>;
    vu$: Observable<VUState>;
}

export class MidiContext {
    private readonly toFaderbox: Output;
    private readonly fromFaderbox: Input;
    private readonly toRotarybox: Output;
    private readonly fromRotarybox: Input;
    private readonly toMixingStation: Output[];
    private readonly fromMixingStation: Input[];

    private readonly sysexMcu$: Observable<MessageEvent>[];
    private readonly controlchange$: Observable<ControlChangeMessageEvent>[];
    private readonly vu$: Observable<VUState>[];


    constructor(
        private ngZone: NgZone,
    ) {
        // console.log(WebMidi.outputs.map(o => o.name));

        this.toFaderbox = WebMidi.getOutputByName(FADERBOX_NAME);
        this.toRotarybox = WebMidi.getOutputByName(ROTARYBOX_NAME);
        this.toMixingStation = BRIDGE_TO_MIXINGSTATION.map(name => WebMidi.getOutputByName(name));

        this.fromFaderbox = WebMidi.getInputByName(FADERBOX_NAME);
        this.fromRotarybox = WebMidi.getInputByName(ROTARYBOX_NAME);
        this.fromMixingStation = BRIDGE_FROM_MIXINGSTATION.map(name => WebMidi.getInputByName(name));

        this.fromFaderbox.addForwarder(this.toMixingStation[0]);
        this.fromMixingStation[0].addForwarder(this.toFaderbox);

        this.fromRotarybox.addForwarder(this.toMixingStation[1]);
        this.fromMixingStation[1].addForwarder(this.toRotarybox);

        // fromFaderbox.addListener('midimessage', e => {
        //     console.log('midimessage', e.message.data.map( n => n.toString(16)).join(" ") + " - " + e.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join(""), e);
        // });

        // this.fromMixingStation[0].addListener('channelaftertouch', e => {

        //     if ( (e.message.data[0] == 0xd0 && (e.message.data[1] & 0xf0) == 0)) {
        //         console.log('channelaftertouch', e.message.data.map( n => n.toString(16)).join(" ") + " - " + e.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join(""), e);
        //     }
        // });

        // this.fromMixingStation[0].addListener('noteon', e => {

        // });
        // fromMixingStation.addListener('noteoff', e => {
        //     console.log('noteoff', e);

        // });

        this.vu$ = this.fromMixingStation.map(input => {
            const subject = new Subject<VUState>();
            input.addListener('channelaftertouch', e => {
                if (e.message.data[0] == 0xd0) {
                    this.ngZone.run(() => subject.next({
                        channel: (e.message.data[1] & 0xf0) >> 4,
                        value: e.message.data[1] & 0x0f
                    }));
                }
            });
            return subject
        });

        this.controlchange$ =  this.fromMixingStation.map(input => {
            const subject = new Subject<ControlChangeMessageEvent>();
            input.addListener('controlchange', e => {
                this.ngZone.run(() => subject.next(e));
            });
            return subject
        });

        this.sysexMcu$ = this.fromMixingStation.map(input => {
            const subject = new Subject<MessageEvent>();
            input.addListener('sysex', e => {
                if (arraysEqual(e.message.data.slice(0, 4), [0xf0, 0x00, 0x00, 0x66])) {
                    this.ngZone.run(() =>subject.next(e));
                }
            });

            return subject
        });

        merge(...this.sysexMcu$).pipe(
            filter(e => e.message.data[5] !== 0x12 && e.message.data[5] !== 0x72)
        ).subscribe(x => console.log(x.message.data.map( n => n.toString(16)).join(" ") + " - " + x.message.data.slice(7, -1).map(n => String.fromCharCode(n)).join("")) )
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
            vu$: initVU(this.vu$[controllerindex], index),
        }
    }

    getMainChannel(): MidiChannelStrip {
        return this.getChannel(7, 1);
    }


}



// tap(x => console.log(x.message.data.map( n => n.toString(16)).join(" "))),
// tap(x => console.log(x)),
