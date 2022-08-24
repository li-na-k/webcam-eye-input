import { Component, OnDestroy, OnInit } from '@angular/core';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';


@Component({
  selector: 'app-hover',
  templateUrl: './hover.component.html',
  styleUrls: ['./hover.component.css']
})
export class HoverComponent implements OnInit, OnDestroy {

  public interval : any;
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE;
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
    this.activateSelectedInputType();

  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
    this.destroy$.next(true);
    this.destroy$.complete();
}

public checkEyeInput(){
  var el = document.getElementById("recthover");
  var inside : boolean | undefined = false;
  this.interval = setInterval(() => {
    if(el){
      inside = this.eyesOnlyInput.checkIfInsideElement(el);
    }
    if (inside == true && el){
      el.style.backgroundColor = "var(--apricot)";
    }
    else if(inside == false && el){
      el.style.backgroundColor = "var(--blue)";
    }
  }, 100);
}

public binded_startMix1Input = this.startMix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
public binded_moveArrowWithMouse = this.moveArrowWithMouse.bind(this);

public startMix1Input(e : any){
  if(e.keyCode == 13){
    var el = document.getElementById("recthover");
    var inside : boolean = false;
    if(el){    
      inside = this.eyesOnlyInput.checkIfInsideElement(el);
      if (inside == true){ 
        el.style.backgroundColor = "var(--apricot)";
      }
      else if(inside == false){
        el.style.backgroundColor = "var(--blue)";
      }
    }
  }
}
//TODO: after hover, switch to blue again


public startMouseInput(){
  document.getElementById("recthover")!.style.backgroundColor = "var(--apricot)"
}

public mouseInput : boolean = false;
public timeOutAfterMouseInput : any;
public arrow : HTMLElement | null = null;

public startMix2Input(){
  this.arrow = document.getElementById("arrow");
  this.arrow!.style.visibility = "visible";
  const all = document.getElementById("experimentSandbox");
  all!.style.cursor = 'none';
  this.interval = setInterval(() => {
    if(!this.mouseInput){
      this.arrow!.classList.add("smoothTransition");
      this.eyesOnlyInput.moveArrowWithEyes();
    }
    else{
      this.arrow!.classList.remove("smoothTransition");
    }
  }, 100);
  all!.addEventListener('mousemove', this.binded_moveArrowWithMouse);
  this.arrow!.style.left = "10px";
  this.arrow!.style.top = "10px";
}


public moveArrowWithMouse(e : any){
  this.mouseInput = true;
  // const all = document.getElementById("experimentSandbox");
  // all!.removeEventListener('mousemove', this.binded_moveArrowWithMouse);
  const w = window.innerWidth;
  const h = window.innerHeight;
  var x = parseInt(this.arrow!.style.left, 10) + e.movementX;
  var y = parseInt(this.arrow!.style.top, 10) + e.movementY;
  if (x > w-24) {
    x = w-24
  }
  if (y > h-24) {
      y = h-24
  }
  this.arrow!.style.left = x + "px";
  this.arrow!.style.top = y + "px";
  this.timeOutAfterMouseInput = setTimeout(() => {
    this.mouseInput = false;
  }, 1000)

  // arrow!.style.left = e.clientX + "px";
  // arrow!.style.top = e.clientY + "px";
}

public stopOtherInputs(){
  var el = document.getElementById("recthover");
  el!.style.backgroundColor = "var(--blue)";
  //end Eye Input & MIX2 interval
  clearInterval(this.interval);
  //end Mix1 click event
  //window.removeEventListener('click', this.binded_startMix1Input)
  document.body.removeEventListener('keydown', this.binded_startMix1Input); 
  document.getElementById("recthover")?.removeEventListener('hover', this.startMouseInput);
  //MIX2
  const all = document.getElementById("experimentSandbox");
  all!.removeEventListener('mousemove', this.binded_moveArrowWithMouse);
}

public activateSelectedInputType(){
  if(this.selectedInputType == InputType.EYE){
    this.stopOtherInputs();
    this.checkEyeInput();
  }
  if(this.selectedInputType == InputType.MOUSE){
    this.stopOtherInputs();
    document.getElementById("recthover")?.addEventListener('hover', this.startMouseInput);
  }
  if(this.selectedInputType == InputType.MIX1){
    this.stopOtherInputs();
    //window.addEventListener('click', this.binded_startMix1Input);
    document.body.addEventListener('keydown', this.binded_startMix1Input); 
  }
  if(this.selectedInputType == InputType.MIX2){
    this.stopOtherInputs();
    console.log("mix2")
    this.startMix2Input();
    //TODO
  }
}



}


