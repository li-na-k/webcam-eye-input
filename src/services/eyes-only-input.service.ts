import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from 'src/app/state/eyetracking/eyetracking.selector';
import { AppState } from 'src/app/state/app.state';


@Injectable({
  providedIn: 'root'
})
export class EyesOnlyInputService implements OnDestroy {

  public currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);

  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  constructor(private store : Store<AppState>) { }

  public checkIfInsideElement(el : HTMLElement) : boolean{
    var x = 0.0;
    var y = 0.0;
    this.currentEyePos$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => {
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

  public moveArrowWithEyes(){
    var x = 0.0;
    var y = 0.0;
    this.currentEyePos$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => {
      x = d.x;
      y = d.y;
    });

    var arrow = document.getElementById("arrow");
    arrow!.style.left = x + "px";
    arrow!.style.top = y + "px"
  }



  ngOnDestroy(): void{
    this.destroy$.next(true);
    this.destroy$.complete();
  }



}