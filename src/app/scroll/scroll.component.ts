import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';
import { InputType } from '../enums/input-type';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent implements OnInit, OnDestroy {

  public interval : any;
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE;
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables
  public scrollAreas = document.getElementsByClassName("scroll-area");


  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {
    this.arrow = document.getElementById("arrow");
    this.sandbox = document.getElementById("experimentSandbox");
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
    this.activateSelectedInputType();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval)
    this.destroy$.next(true);
    this.destroy$.complete();
  } 

  public scroll(scrollArea : HTMLElement){
    if(scrollArea.classList.contains("bottom")){
      window.scrollBy(0, 10);
    }
    if(scrollArea.classList.contains("top")){
      window.scrollBy(0, -10);
    }
    if(scrollArea.classList.contains("left")){
      window.scrollBy(-10, 0);
    }
    if(scrollArea.classList.contains("right")){
      window.scrollBy(10, 0);
    }
  }

  public checkEyeInput(){
    var inside : boolean = false;
    this.interval = setInterval(() => {
      for(var i = 0; i < this.scrollAreas.length; i++){
        var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
        inside = this.eyesOnlyInput.areEyesInsideElement(el!);
        if (inside == true){
          this.scroll(el);
        }
      }
    }, 100)
  }


public binded_startMix1Input = this.startMix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
public startMix1Input(e : any){
  if(e.keyCode == 13){
    for(var i = 0; i < this.scrollAreas.length; i++){
      var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
      var inside : boolean = false;
      if(el){     
        inside = this.eyesOnlyInput.areEyesInsideElement(el);
        if (inside == true){ 
          this.scroll(el);
        }
      }
    }
  }
}

public mouseInput : boolean = false;
public timeOutAfterMouseInput : any;
public arrow : HTMLElement | null = null;
public sandbox : HTMLElement | null = null;
public moveArrowinterval : any;

public startMix2Input(){
  this.arrow!.style.visibility = 'visible';
  this.sandbox!.style.cursor = 'none';
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
  var inside : boolean | undefined = false;
  this.interval = setInterval(() => {
    for(var i = 0; i < this.scrollAreas.length; i++){
      var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
      inside = this.eyesOnlyInput.isInside(el, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
      if (inside == true){
        this.scroll(el);
      }
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
  window.scrollTo(0,0);
  //end Eye Input
  clearInterval(this.interval);
  //end Mix1 click event
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
  if(this.selectedInputType == InputType.EYE){
    this.stopOtherInputs();
    this.checkEyeInput();
  }
  if(this.selectedInputType == InputType.MOUSE){
    this.stopOtherInputs();
  }
  if(this.selectedInputType == InputType.MIX1){
    this.stopOtherInputs();
    document.body.addEventListener('keydown', this.binded_startMix1Input); 
  }
  if(this.selectedInputType == InputType.MIX2){
    this.stopOtherInputs();
    this.startMix2Input();
  }
}
}






    

