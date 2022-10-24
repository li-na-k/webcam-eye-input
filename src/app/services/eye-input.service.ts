import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from 'src/app/state/eyetracking/eyetracking.selector';
import { AppState } from 'src/app/state/app.state';


@Injectable({
  providedIn: 'root'
})
export class EyeInputService implements OnDestroy {

  public currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables
  // properties for Mix 2
  public mouseInput : boolean = false;
  public timeOutAfterMouseInput : any;
  public moveArrowInterval : any;
  public arrow : HTMLElement | null = null;
  public sandbox : HTMLElement | null = null;
  public timeout : number = 0;

  constructor(private store : Store<AppState>) { }

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

  public moveArrowWithEyes(arrow : HTMLElement | null){
    let x = 0.0;
    let y = 0.0;
    this.currentEyePos$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => {
      x = d.x;
      y = d.y;
    });
    if(this.arrow){
      arrow!.style.left = x + "px";
      arrow!.style.top = y + "px"
    }
    else{
      throw Error("Provided arrow is null.")
    }
  } 

  public moveArrowWithMouse(e : any, arrow : HTMLElement, sandbox : HTMLElement){
    let x = parseInt(arrow!.style.left, 10) + e.movementX;
    let y = parseInt(arrow!.style.top, 10) + e.movementY;
    const sbRight = sandbox!.getBoundingClientRect().right;
    const sbBottom = sandbox!.getBoundingClientRect().bottom;
    const sbLeft = sandbox!.getBoundingClientRect().left;
    const sbTop = sandbox!.getBoundingClientRect().top;
    if (x > sbRight) {
      x = sbRight
    }
    if (x < sbLeft) {
      x = sbLeft
    }
    if (y > sbBottom) {
      y = sbBottom
    }
    if (y < sbTop) {
      y = sbTop
    }
    arrow!.style.left = x + "px";
    arrow!.style.top = y + "px";
  }

  public activateMix2Input(sandbox : HTMLElement | null, arrow : HTMLElement | null, timeout: number){
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
    //assign method parameters to instance properties to be able to use them in mouseTakeover()
    this.sandbox = sandbox; 
    this.arrow = arrow;
    this.timeout = timeout;
    this.sandbox!.requestPointerLock(); 
    this.arrow!.style.visibility = 'visible';
    //eye input
    this.moveArrowInterval = setInterval(() => {
      if(!this.mouseInput){
        this.arrow!.classList.add("smoothTransition");
        this.moveArrowWithEyes(this.arrow);
    }
    else{
      this.arrow!.classList.remove("smoothTransition");
    }
    }, 100);
    window.document.addEventListener('mousemove', this.bound_mouseTakeover); 
  }

  private bound_mouseTakeover = this.mouseTakeover.bind(this);
  private mouseTakeover(e : any){
    clearTimeout(this.timeOutAfterMouseInput);
    this.mouseInput = true;
    this.moveArrowWithMouse(e, this.arrow!, this.sandbox!);
    this.timeOutAfterMouseInput = setTimeout(() => {
      this.mouseInput = false;
    }, this.timeout)
  }
  
  public stopMix2Input(sandbox : HTMLElement | null, arrow : HTMLElement | null){
    document.exitPointerLock();
    const dot = document.getElementById("webgazerGazeDot");
    if(dot){
      dot.style.visibility = "";
    }
    window.document.removeEventListener('mousemove', this.bound_mouseTakeover);
    arrow!.style.visibility = 'hidden';
    sandbox!.style.cursor = '';
    clearTimeout(this.timeOutAfterMouseInput);
    clearInterval(this.moveArrowInterval);
  }

  ngOnDestroy(): void{
    this.destroy$.next(true);
    this.destroy$.complete();
  }



}