import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from 'src/app/state/eyetracking/eyetracking.selector';
import { AppState } from 'src/app/state/app.state';


@Injectable({
  providedIn: 'root'
})
export class EyesOnlyInputService implements OnDestroy {

  public currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);

  constructor(private store : Store<AppState>) { }

  public checkIfInsideRect() : boolean | undefined{
    var x = 0.0;
    var y = 0.0;
    this.currentEyePos$.subscribe(d => {
      x = d.x;
      y = d.y;
    });

    var el = document.getElementById("rect");
    if(el){
      var boundingBox = el.getBoundingClientRect();
      if(boundingBox.left <= x && boundingBox.right >= x && boundingBox.top <= y && boundingBox.bottom >= y){
        return true;
      }
      else{
        return false;
      }
    }
    else{
      return undefined;
    }  
  }

  ngOnDestroy(): void{
    //todo: cancel subscribe
  }



}