import { Observable, map } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sendValue'
})
export class SendValuePipe implements PipeTransform {

  transform(v: Observable<number>): Observable<{value: number}> {
    return v.pipe(
        map(x => {
            return {value: x};
        })
    );
  }

}
