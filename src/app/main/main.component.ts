import { Observable, map } from 'rxjs';
import { ChannelStrip, MidiService } from './../services/midi.service';
import {Component} from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.sass'],

})
export class MainComponent {
    channels$: Observable<Array<ChannelStrip>>;
    busmaster$: Observable<ChannelStrip>;

    constructor(private midiService: MidiService) {
        this.channels$ = midiService.midiContext$.pipe(
            map(c => {
                const channels = []
                for (let index = 0; index < 8; index++) {
                    channels[index] = c.getChannel(index);
                }
                return channels;
            })
        );

        this.busmaster$ = midiService.midiContext$.pipe(
            map(c => c.getMainChannel())
        )
    }

}

