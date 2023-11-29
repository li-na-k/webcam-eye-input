import { Pipe, PipeTransform } from '@angular/core';
import { Positions } from './enums/positions';

@Pipe({
  name: 'matCardTitle'
})
export class MatCardTitlePipe implements PipeTransform {

  transform(pos: Positions, screen = 1): string {
    if(screen == 1){
      return pos;
    }
    else{
      return String(Number(pos)+2);
    }
  }

}
