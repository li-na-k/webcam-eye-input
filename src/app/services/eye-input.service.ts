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
  private arrow : HTMLElement | null = null;
  private sandbox : HTMLElement | null = null;
  private timeout : number = 1000; //in this branch: after what time is mouseInput interval considered to have ended (for TaskResult)

  constructor(private store : Store<AppState>, private taskEvaluationService : TaskEvaluationService) { }

  public areEyesInsideElement(el : HTMLElement) : boolean{
    let x = 0.0;
    let y = 0.0;
    this.currentEyePos$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => {
      x = d.x;
      y = d.y;
    });
    return this.isInside(el, x, y);
  }

  public isInside(el : HTMLElement, x? : number, y?: number){
    let clientWidth = document.documentElement.clientWidth;
    let clientHeight = document.documentElement.clientHeight;
    let boundingBox = el.getBoundingClientRect();
    let lr_inside = false;
    let tb_inside = false;
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

  public moveArrowWithEyes(arrow : HTMLElement, onlyXDir : boolean = false){ //move to current eye pos
    let x = 0.0;
    let y = 0.0;
    this.currentEyePos$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => {
      x = d.x;
      y = d.y;
    });
    if(onlyXDir){
      arrow.style.transform = "translate(" + x + "px, 50vh)" 
    }
    else{
      arrow.style.transform = "translate(" + x + "px, " + y + "px)"
    }
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
  }

  public async activateMix2Input(sandbox : HTMLElement | null, arrow : HTMLElement | null, timeout: number){
    //lock original cursor, add fake arrow instead
    if(!sandbox){
      throw Error("Provided sandbox is null.")
    }
    if(!arrow){
      throw Error("Provided arrow is null.")
    }
    //remove red dot
    const dot = document.getElementById("webgazerGazeDot");
    if(dot){
      dot.style.visibility = "hidden";
    }
    //assign method parameters to instance properties to be able to use them in moveArrowWithMouse()
    this.sandbox = sandbox; 
    this.arrow = arrow;
    this.timeout = timeout;
    await this.sandbox!.requestPointerLock(); 
    this.arrow!.style.visibility = 'visible';
    this.arrow!.style.left = "50%";
    this.arrow!.style.top = "50%";
    //eye input
    this.moveArrowInterval = setInterval(() => {
      if(!this.mouseInput){
        this.arrow!.classList.add("smoothTransition");
        this.moveArrowWithEyes(this.arrow!);
      }
      else{
        this.arrow!.classList.remove("smoothTransition");
      }
    window.document.addEventListener('mousemove', this.bound_mouseTakeover); 
    }, 400);
  }

  private bound_mouseTakeover = this.mouseTakeover.bind(this);
  private mouseTakeover(e : any){
    clearTimeout(this.timeOutAfterMouseInput);
    if(!this.mouseInput){ //until now it was eye input, now change to mouse input
      this.mouseInput = true;
      this.taskEvaluationService.endEyeMouseInterval(); //end previous EYE interval
    }
    const sbRight = this.sandbox!.getBoundingClientRect().right; //TODO nicht jedes mal berechnen...
    const sbBottom = this.sandbox!.getBoundingClientRect().bottom;
    const sbLeft = this.sandbox!.getBoundingClientRect().left;
    const sbTop = this.sandbox!.getBoundingClientRect().top;
    this.moveArrowWithMouse(e, this.arrow!, [sbTop, sbRight, sbBottom, sbLeft]);
    this.timeOutAfterMouseInput = setTimeout(() => {
      this.mouseInput = false;
      this.taskEvaluationService.endEyeMouseInterval(); //end previous MOUSE interval, timeout after mouse input (500ms) counts as mouse input
    }, this.timeout)
  }

  public bound_measureMouseDist = this.measureMouseDist.bind(this);
  private measureMouseDist(){ //similar to mouseTakeover but only for measuring, no takeover of fake cursor 
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
  
  public stopMix2Input(sandbox : HTMLElement, arrow : HTMLElement){
    document.exitPointerLock();
    const dot = document.getElementById("webgazerGazeDot");
    if(dot){
      dot.style.visibility = "";
    }
    window.document.removeEventListener('mousemove', this.bound_mouseTakeover);
    arrow.style.visibility = 'hidden';
    sandbox.style.cursor = '';
    clearTimeout(this.timeOutAfterMouseInput);
    clearInterval(this.moveArrowInterval);
    this.mouseInput = false;
  }

  ngOnDestroy(): void{
    this.destroy$.next(true);
    this.destroy$.complete();
  }



}