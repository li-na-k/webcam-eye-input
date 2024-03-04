import { Pipe, PipeTransform } from '@angular/core';
import { Positions } from './enums/positions';

@Pipe({
  name: 'matCardTitle'
})
export class MatCardTitlePipe implements PipeTransform {

  transform(pos: Positions, mainScreen = true): string {
    if(!mainScreen){
      return pos;
    }
    else{
      return String(Number(pos)+2);
    }
  }

}
