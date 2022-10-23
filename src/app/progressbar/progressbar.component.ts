import { RotaryState } from './../services/midi-init';

import { Observable, of, Subject, switchMap, startWith, ReplaySubject, tap, shareReplay, map } from 'rxjs';
import { Component,  Input, OnChanges, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';

interface rangeValue {
    low?: number;
    high?: number;
    value: number;
}

@Component({
  selector: 'app-progressbar',
  templateUrl: './progressbar.component.html',
  styleUrls: ['./progressbar.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressbarComponent implements OnChanges {
    @Input() low = 0;
    @Input() high = 100;
    @Input() set value$(v: Observable<rangeValue> | null) {
        if (v) {
            this.value.next(v);
        }
    }

    private range = 100;
    private value = new ReplaySubject<Observable<rangeValue>>(1);
    public uiValue$: Observable<rangeValue>;

    constructor() {
        this.uiValue$ = this.value.pipe(
            switchMap(v => v),
            tap(v => {
                if (v.high) {
                    this.high = v.high
                }
                if (v.low) {
                    this.low = v.low
                }
            }),
            map(v => {
                return { value: (v.value - this.low) * 100 / this.range}
            }),
            shareReplay(1),
        )
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.range = this.high - this.low;
    }
}
