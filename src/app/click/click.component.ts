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
        inside = this.eyesOnlyInput.checkIfInsideElement(el);
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

  public binded_startMix1Input = this.startMix1Input.bind(this);

  public startMix1Input(){
    console.log("clicked");
    var el = document.getElementById("rect");
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
    else{
      console.log("el undefined")
    }
  }

  public stopOtherInputs(){
    var el = document.getElementById("rect");
    el!.style.backgroundColor = "var(--blue)";
    //end Eye Input
    clearInterval(this.interval);
    //end Mix1 click event
    el!.removeEventListener('click', this.binded_startMix1Input)
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
      var el = document.getElementById("rect");
      el!.addEventListener('click', this.binded_startMix1Input);
      console.log("mix1")
    }
    if(this.selectedInputType == InputType.MIX2){
      this.stopOtherInputs();
      console.log("mix2")
    }
  }

  //todo bei anderen C immer erst eyestop, damit intervall gecancelt





}
