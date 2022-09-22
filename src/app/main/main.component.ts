import { ChannelService, ChannelStrip } from './../services/channel.service';
import { Observable, map, switchMap, of } from 'rxjs';
import {Component} from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.sass'],

})
export class MainComponent {
    channels$: Array<Observable<ChannelStrip>>;
    busmaster$: Observable<ChannelStrip>;
    color$: Observable<string>;

    constructor(channelService: ChannelService) {
        this.channels$ = []
        for (let index = 0; index < 8; index++) {
            this.channels$[index] = channelService.getChannel(index);
        }

        this.busmaster$ = channelService.getMainChannel()

        this.color$ = this.busmaster$.pipe(
            switchMap(chan => {
                if (chan.index == 31) {// Main Out
                    return of('');
                }

                return chan.color$
            })
        )
    }

}

