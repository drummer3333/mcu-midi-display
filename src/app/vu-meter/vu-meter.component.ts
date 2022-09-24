import { ReplaySubject, Observable, switchMap, shareReplay, startWith, tap } from 'rxjs';
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { VUState } from '../services/midi-init';

@Component({
  selector: 'app-vu-meter',
  templateUrl: './vu-meter.component.html',
  styleUrls: ['./vu-meter.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VuMeterComponent implements OnInit {
    @Input() public set vu(c: Observable<VUState>){
        this._vu.next(c);
    }
    private _vu = new ReplaySubject<Observable<VUState>>(1);
    public readonly vu$: Observable<VUState>;
    public leds: Array<number> = [];

    public ORANGE_LED = 8
    public PEAK_LED = 14

    constructor() {
        for (let index = 0; index < 13; index++) {
            this.leds[index] = index;
        }

        this.vu$ = this._vu.pipe(
            switchMap(v => v),
            startWith({
                channel: -1,
                value: 0,
                peak: false,
            }),
            shareReplay(1)
        )
    }

    ngOnInit(): void {
    }

}
