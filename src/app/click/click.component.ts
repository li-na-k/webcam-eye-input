import { Component, OnDestroy, OnInit } from '@angular/core';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';

@Component({
  selector: 'app-click',
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent implements OnInit, OnDestroy {

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
      clearInterval(this.interval)
  }

  public checkEyeInput(){
    var el = document.getElementById("rect");
    const dwellTime = 1000;
    var wentInsideAt : number|null = null; 
    var inside : boolean = false;
    this.interval = setInterval(() => {
      if(el){
        inside = this.eyesOnlyInput.areEyesInsideElement(el);
      }
      if (inside == true && el){
        if (!wentInsideAt) {
          wentInsideAt = Date.now()
        }
        else if (wentInsideAt + dwellTime < Date.now()) {
          el.style.backgroundColor = "var(--apricot)";
        }
      }
      else if(inside == false && el){
        wentInsideAt = null;
        el.style.backgroundColor = "var(--blue)";
      }
    }, 100);
  }

  public binded_startMix1Input = this.startMix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
  public binded_mouseTakeover = this.mouseTakeover.bind(this);

  public startMix1Input(e : any){
    if(e.keyCode == 13){
      var el = document.getElementById("rect");
      var inside : boolean = false;
      if(el){    
        inside = this.eyesOnlyInput.areEyesInsideElement(el);
        if (inside == true){ 
          el.style.backgroundColor = "var(--apricot)";
        }
        else if(inside == false){
          el.style.backgroundColor = "var(--blue)";
        }
      }
    }
  }

  public startMouseInput(){
    document.getElementById("rect")!.style.backgroundColor = "var(--apricot)"
  }

  public mouseInput : boolean = false;
  public timeOutAfterMouseInput : any;
  public arrow : HTMLElement | null = null;
  public sandbox = document.getElementById("experimentSandbox");

  public startMix2Input(){
    this.arrow = document.getElementById("arrow");
    this.sandbox = document.getElementById("experimentSandbox");
    //switching cursor visibility
    this.arrow!.style.visibility = "visible";
    this.sandbox!.style.cursor = 'none';
    //activate eye input
    this.interval = setInterval(() => {
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
    //click color effect
    window.document.addEventListener('click', this.binded_clickEffect); 
  }

  public binded_clickEffect = this.clickEffect.bind(this); 
  public clickEffect(){
    var el = document.getElementById("rect");
    var inside : boolean | undefined = false;
    inside = this.eyesOnlyInput.isInside(el!, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
    if (inside == true && el){
      el.style.backgroundColor = "var(--apricot)";
    }
    else if(inside == false && el){
      el.style.backgroundColor = "var(--blue)";
    }
  }

  public mouseTakeover(e : any){
    clearTimeout(this.timeOutAfterMouseInput);
    this.mouseInput = true;
    this.eyesOnlyInput.moveArrowWithMouse(e, this.arrow!, this.sandbox!);
    this.timeOutAfterMouseInput = setTimeout(() => {
      this.mouseInput = false;
    }, 1500)
  }

  public stopOtherInputs(){
    var el = document.getElementById("rect");
    el!.style.backgroundColor = "var(--blue)";
    //end Eye Input
    clearInterval(this.interval);
    //end Mix1 click event
    //window.removeEventListener('click', this.binded_startMix1Input)
    document.body.removeEventListener('keydown', this.binded_startMix1Input); 
    //remove click event MOUSE input
    document.getElementById("rect")?.removeEventListener('click', this.startMouseInput);
    //MIX2
    window.document.removeEventListener('mousemove', this.binded_mouseTakeover);
    window.document.removeEventListener('click', this.binded_clickEffect); 
  }

  public activateSelectedInputType(){
    if(this.selectedInputType == InputType.EYE){
      this.stopOtherInputs();
      this.checkEyeInput();
    }
    if(this.selectedInputType == InputType.MOUSE){
      this.stopOtherInputs();
      document.getElementById("rect")?.addEventListener('click', this.startMouseInput);
    }
    if(this.selectedInputType == InputType.MIX1){
      this.stopOtherInputs();
      //window.addEventListener('click', this.binded_startMix1Input);
      document.body.addEventListener('keydown', this.binded_startMix1Input); 
    }
    if(this.selectedInputType == InputType.MIX2){
      this.stopOtherInputs();
      this.startMix2Input(); //todo: end 
    }
  }







}
