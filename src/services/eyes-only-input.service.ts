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

  public checkIfInsideElement(el : HTMLElement) : boolean{
    var x = 0.0;
    var y = 0.0;
    this.currentEyePos$.subscribe(d => {
      x = d.x;
      y = d.y;
    });

    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;


    var boundingBox = el.getBoundingClientRect();
    if(
      (boundingBox.left <= x || boundingBox.left <= 0) && 
      (boundingBox.right >= x || boundingBox.right >= clientWidth) && 
      (boundingBox.top <= y || boundingBox.top <= 0) && 
      (boundingBox.bottom >= y || boundingBox.bottom >= clientHeight)){ //e.g. if element is on very bottom of screen, count in gaze that looks even below screen
      return true;
    }

    else{
      return false;   
    }
  }

  ngOnDestroy(): void{
    //todo: cancel subscribe
  }



}