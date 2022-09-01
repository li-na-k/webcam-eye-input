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
  public moveArrowinterval : any;
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE;
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables
  
  public pointerLockedStopped() : boolean {
    if(this.selectedInputType == InputType.MIX2){
      return !(document.pointerLockElement === this.sandbox);
    }
    else{
      return false;
    }
  }

  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  public taskElementID : string = "recthover";
  public taskElement : HTMLElement | null = document.getElementById(this.taskElementID);

  ngOnInit(): void {
    this.taskElement = document.getElementById(this.taskElementID);
    this.arrow = document.getElementById("arrow");
    this.sandbox = document.getElementById("experimentSandbox");
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

  
  public startMouseInput = this.changeElApricot.bind(this);
  //todo switch back to blue afterwards
  
  public changeElApricot(){
    this.taskElement!.style.backgroundColor = "var(--apricot)";
  }

  public changeElBlue(){
    this.taskElement!.style.backgroundColor = "var(--blue)";
  }

  public startEyeInput(){
    var inside : boolean | undefined = false;
    this.interval = setInterval(() => {
      inside = this.eyesOnlyInput.areEyesInsideElement(this.taskElement!);
      if (inside == true && this.taskElement){
        this.changeElApricot();
      }
      else if(inside == false && this.taskElement){
        this.changeElBlue();
      }
    }, 100);
  }

public binded_startMix1Input = this.startMix1Input.bind(this);
public startMix1Input(e : any){
  if(e.keyCode == 13){
    var inside : boolean = false;
    if(this.taskElement){    
      inside = this.eyesOnlyInput.areEyesInsideElement(this.taskElement);
      if (inside == true){ 
        this.changeElApricot()
      }
      else if(inside == false){
        this.changeElBlue()
      }
    }
  }
}
//TODO: after hover, switch to blue again (timeout?)

public mouseInput : boolean = false;
public timeOutAfterMouseInput : any;
public arrow : HTMLElement | null = null;
public sandbox : HTMLElement | null = null;

public startMix2Input(){
  this.sandbox!.requestPointerLock();
  console.log(document.pointerLockElement === this.sandbox);

  this.arrow!.style.visibility = 'visible';
  //activate eye input
  this.moveArrowinterval = setInterval(() => {
    if(!this.mouseInput){
      this.arrow!.classList.add("smoothTransition");
      this.eyesOnlyInput.moveArrowWithEyes();
    }
    else{
      this.arrow!.classList.remove("smoothTransition");
    }
  }, 100);
  //activate mouse input
  window.document.addEventListener('mousemove', this.binded_mouseTakeover);
  //hover color effect
  var inside : boolean | undefined = false;
  this.interval = setInterval(() => {
    inside = this.eyesOnlyInput.isInside(this.taskElement!, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
    if (inside == true){
      this.changeElApricot();
    }
    else if(inside == false){
      this.changeElBlue();
    }
  }, 100);
}

public binded_mouseTakeover = this.mouseTakeover.bind(this);
public mouseTakeover(e : any){
  clearTimeout(this.timeOutAfterMouseInput);
  this.mouseInput = true;
  this.eyesOnlyInput.moveArrowWithMouse(e, this.arrow!, this.sandbox!);
  this.timeOutAfterMouseInput = setTimeout(() => {
    this.mouseInput = false;
  }, 1500)
}

public stopOtherInputs(){
  this.taskElement!.style.backgroundColor = "var(--blue)";
  //EYE & MIX2 interval
  clearInterval(this.interval);
  //MOUSE
  this.taskElement?.removeEventListener('hover', this.changeElApricot);
  //MIX1
  document.body.removeEventListener('keydown', this.binded_startMix1Input); 
  //MIX2
  window.document.removeEventListener('mousemove', this.binded_mouseTakeover);
  this.arrow = document.getElementById("arrow");
  this.arrow!.style.visibility = 'hidden';
  this.sandbox!.style.cursor = '';
  clearTimeout(this.timeOutAfterMouseInput);
  clearInterval(this.moveArrowinterval);
}

public activateSelectedInputType(){
  this.stopOtherInputs();
  if(this.selectedInputType == InputType.EYE){
    this.startEyeInput();
  }
  if(this.selectedInputType == InputType.MOUSE){
    this.taskElement?.addEventListener('mouseover', this.startMouseInput);
  }
  if(this.selectedInputType == InputType.MIX1){
    document.body.addEventListener('keydown', this.binded_startMix1Input); 
  }
  if(this.selectedInputType == InputType.MIX2){
    this.startMix2Input();
  }
}



}


