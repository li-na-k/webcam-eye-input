import { Injectable, NgZone, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
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
  private timeout : number = 1000; //after what time is mouseInput interval considered to have ended (for switch to EyeInput + TaskResult EyeMouseDistribution)
  private renderer: Renderer2;

  private x = 0.0;
  private y = 0.0;

  constructor(private store : Store<AppState>, private taskEvaluationService : TaskEvaluationService, rendererFactory: RendererFactory2, private ngZone: NgZone) { 
    this.renderer = rendererFactory.createRenderer(null, null);
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
    let x : number = this.x * window.innerWidth;
    let y : number = (1-this.y) * window.innerHeight;

    this.applyTransformation(arrow, x, y);
  } 

  private applyTransformation(obj: HTMLElement, x : number, y : number){  //DOM is only manipulated once per frame, without ng change detection -> more efficient
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.renderer.setStyle(obj, 'transform', `translate(${x}px, ${y}px)`);
      });
    });

  }

  public moveArrowWithMouse(e: MouseEvent, arrow: HTMLElement, limits: [number, number, number, number]) {
    const pointerAcceleration : number = 2;
    this.ngZone.runOutsideAngular(() => {

      const matrix = new WebKitCSSMatrix(window.getComputedStyle(arrow).transform);
      let x = matrix.m41 + e.movementX*pointerAcceleration;
      let y = matrix.m42 + e.movementY*pointerAcceleration;
      
      x = Math.max(limits[3], Math.min(x, limits[1])); // Left and right boundaries
      y = Math.max(limits[0], Math.min(y, limits[2])); // Top and bottom boundaries
      
      this.applyTransformation(arrow, x, y);
      
      this.registerMouseStartStop();
    });
  }

  public async activateEyeInput(window: Window, arrow : HTMLElement | null, timeout: number, moveCursor : boolean = true){
    //this.stopMix2Input();
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
    this.renderer.setStyle(this.arrow, 'visibility', 'visible');
    //eye input
    const refreshRate = 60; // screen refresh rate, adapt if necessary
    const intervalDelay = 1000 / refreshRate;
    clearInterval(this.moveArrowInterval);
    let lastUpdate = 0;
    this.ngZone.runOutsideAngular(() => {
      this.moveArrowInterval = setInterval(() => {
        const now = performance.now();
        if (now - lastUpdate >= intervalDelay) { // only update when necessary
          if(!this.mouseInput && moveCursor){
            this.renderer.addClass(this.arrow!, 'smoothTransition');
            this.moveArrowWithEyes(this.arrow!, window);
          } else {
            this.renderer.removeClass(this.arrow!, 'smoothTransition');
          }
          lastUpdate = now;
        }
      }, intervalDelay);
    });
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
      this.renderer.setStyle(this.arrow, 'visibility', 'hidden');
    }
    this.renderer.setStyle(document.body, 'cursor', '');
    this.mouseInput = false;
  }

  ngOnDestroy(): void{
    this.destroy$.next(true);
    this.destroy$.complete();
    clearTimeout(this.timeOutAfterMouseInput);
    clearInterval(this.moveArrowInterval); // clear the interval
    this.stopMix2Input();
  }
}