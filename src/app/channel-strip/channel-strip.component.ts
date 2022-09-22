import { Observable, Subject, switchMap, map, ReplaySubject, shareReplay } from 'rxjs';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChannelStrip } from '../services/channel.service';

@Component({
  selector: 'app-channel-strip',
  templateUrl: './channel-strip.component.html',
  styleUrls: ['./channel-strip.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelStripComponent {
    @Input() public set channelStrip(c: ChannelStrip | null){
        if (c) {
            this.channelStrip$.next(c);
        }
    }
    channelStrip$ = new ReplaySubject<ChannelStrip>(1);


    constructor() {
    }
}
