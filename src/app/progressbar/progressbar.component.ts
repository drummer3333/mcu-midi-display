import { RotaryState } from './../services/midi-init';

import { Observable, of, Subject, switchMap, startWith, ReplaySubject, tap, shareReplay } from 'rxjs';
import { Component,  Input, OnChanges, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';


@Component({
  selector: 'app-progressbar',
  templateUrl: './progressbar.component.html',
  styleUrls: ['./progressbar.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressbarComponent  {
    @Input() set value$(v: Observable<RotaryState>) {
        this.value.next(v);
    }

    private value = new ReplaySubject<Observable<RotaryState>>(1);
    public uiValue$: Observable<RotaryState>;


    constructor() {
        this.uiValue$ = this.value.pipe(
            switchMap(v => v),
            shareReplay(1)
        )
    }
}
