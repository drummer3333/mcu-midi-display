import { Observable, filter, map, startWith, share, combineLatest, tap, shareReplay } from 'rxjs';
import { ControlChangeMessageEvent, MessageEvent } from 'webmidi';

export function initLcd(sysex$: Observable<MessageEvent>, index: number, lcd: number): Observable<string> {
    return sysex$.pipe(
        filter(e => e.message.data[5] === 0x12 && e.message.data[6] === index * 7 + (lcd * 0x38)),
        map(e => e.message.data.slice(7, -1).map(s => String.fromCharCode(s)).join("")),
        startWith(''),
        share()
    );
}

const colors = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
]
export function initLcdColor(sysex$: Observable<MessageEvent>, index: number): Observable<string> {
    return sysex$.pipe(
        filter(e => e.message.data[5] === 0x72),
        map( e => colors[e.message.data[6 + index]]),
        startWith(''),
        share()
    )
}

export interface RotaryState {
    value: number
}
export function initRotary(cc$: Observable<ControlChangeMessageEvent>, index: number): Observable<RotaryState> {
    const rotoryController = 0x30 + index;
    return cc$.pipe(
        filter(e => e.controller.number === rotoryController),
        map(e => {
            const v = ((e.rawValue || 0) & 0x0f) - 1;
            if (v < 0) {
                return -1
            }
            return v * 10;
        }),
        startWith(-1),
        map(value => <RotaryState>{
            value,
        })
    );
}


export interface VUState {
    channel: number;
    value: number;
}
export function initVU(base$: Observable<VUState>, index: number): Observable<VUState> {
    return base$.pipe(
        filter(e => e.channel == index),
    );;
}
