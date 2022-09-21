import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'log'
})
export class LogPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    console.log ('log pipe', value)
    return value;
  }

}
