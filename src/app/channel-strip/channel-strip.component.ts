import { ChannelStrip } from './../services/midi.service';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-channel-strip',
  templateUrl: './channel-strip.component.html',
  styleUrls: ['./channel-strip.component.sass']
})
export class ChannelStripComponent {
    @Input() public channelStrip?: ChannelStrip

    constructor() { }
}
