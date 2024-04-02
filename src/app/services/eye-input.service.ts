import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from 'src/app/state/eyetracking/eyetracking.selector';
import { AppState } from 'src/app/state/app.state';
import { TaskEvaluationService } from './task-evaluation.service';

@Injectable({
  providedIn: 'root'
})
export class EyeInputService implements OnDestroy {

  private currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);
  private destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables
  // properties for Mix 2
  private mouseInput : boolean = false;
  private timeOutAfterMouseInput : any;
  private moveArrowInterval : any;
  private arrow : HTMLElement | null = null; //currently active fake cursor
  private timeout : number = 1000; //in this branch: after what time is mouseInput interval considered to have ended (for TaskResult)

  private x = 0.0;
  private y = 0.0;

  constructor(private store : Store<AppState>, private taskEvaluationService : TaskEvaluationService) { 
    this.currentEyePos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => {
        this.x = d.x;
        this.y = d.y;
      });
  }

  public areEyesInsideElement(el : HTMLElement) : boolean {
    return this.isInside(el, this.x, this.y);
  }

  public isInside(el : HTMLElement, x? : number, y?: number){
    let clientWidth = document.documentElement.clientWidth;
    let clientHeight = document.documentElement.clientHeight;
    let boundingBox = el.getBoundingClientRect();
    let lr_inside : boolean = false;
    let tb_inside : boolean = false;
    if(x){
      if(
      (boundingBox.left <= x || boundingBox.left <= 0) && 
      (boundingBox.right >= x || boundingBox.right >= clientWidth)
      ){
        lr_inside = true;
      }
    }
    else{
      lr_inside = true;
    }
    if(y){
      if(
      (boundingBox.top <= y || boundingBox.top <= 0) && 
      (boundingBox.bottom >= y || boundingBox.bottom >= clientHeight)
      ){
        tb_inside = true;
      }
    }
    else{
      tb_inside = true;
    }
    return (tb_inside && lr_inside)
  }

  public moveArrowWithEyes(arrow : HTMLElement, window : Window){ //move to current eye pos
    let x = this.x * window.innerWidth;
    let y = (1-this.y) * window.innerHeight;
    arrow.style.transform = "translate(" + x + "px, " + y + "px)"
  } 

  public moveArrowWithMouse(e : any, arrow : HTMLElement, limits : [number, number, number, number]){ //move according to mouse movement
    var style = window.getComputedStyle(arrow);
    var matrix = new WebKitCSSMatrix(style.transform);
    var currentx = matrix.m41; 
    var currenty = matrix.m42;
    let x = e.movementX + currentx;
    let y = e.movementY + currenty;
    if (x > limits[1]) {
      x = limits[1]
    }
    else if (x < limits[3]) {
      x = limits[3]
    }
    if (y > limits[2]) {
      y = limits[2]
    }
    if (y < limits[0]) {
      y = limits[0]
    }
    arrow!.style.transform = "translate(" + x + "px, " + y + "px)"
    this.registerMouseStartStop()
  }

  public async activateEyeInput(window: Window, arrow : HTMLElement | null, timeout: number){
    this.stopMix2Input();
    if(!window){
      throw Error("Provided window is null.")
    }
    if(!arrow){
      throw Error("Provided arrow is null.")
    }
    this.arrow = arrow;
    this.timeout = timeout;
    //lock original cursor, add fake arrow instead
    if(document.pointerLockElement == null){ //if not already locked
      await document.body.requestPointerLock();   
    }
    this.arrow!.style.visibility = 'visible';
    //eye input
    clearInterval(this.moveArrowInterval);
    this.moveArrowInterval = setInterval(() => {
      if(!this.mouseInput){
        this.arrow!.classList.add("smoothTransition");
        this.moveArrowWithEyes(this.arrow!, window);
      }
      else{
        this.arrow!.classList.remove("smoothTransition");
      } 
    }, 15); //monitor refresh 60 hz -> 16.6 ms (60 hertz world camera as well)
  }

  private registerMouseStartStop(){ //like mouseTakeover but without takeover of fake cursor (only for analysing how eye/mouse usage was during Mix2)
    clearTimeout(this.timeOutAfterMouseInput);
    if(!this.mouseInput){ //until now it was eye input, now change to mouse input
      this.mouseInput = true;
      this.taskEvaluationService.endEyeMouseInterval(); //end previous EYE intervals
    }
    this.timeOutAfterMouseInput = setTimeout(() => {
      this.mouseInput = false;
      this.taskEvaluationService.endEyeMouseInterval(); //end previous MOUSE interval, timeout after mouse input (500ms) counts as mouse input
    }, this.timeout)
  }
  
  public stopMix2Input(){ //stops last instances of stopMix2Input
    clearTimeout(this.timeOutAfterMouseInput);
    clearInterval(this.moveArrowInterval);
    if(document.pointerLockElement){
      document.exitPointerLock();
    }
    //replace fake cursor with real cursor again
    if(this.arrow){
      this.arrow.style.visibility = 'hidden';
    }
    document.body.style.cursor = '';
    this.mouseInput = false;
  }

  ngOnDestroy(): void{
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}