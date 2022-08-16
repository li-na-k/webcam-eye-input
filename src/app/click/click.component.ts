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

  public stopEyeInput(){
    clearInterval(this.interval);
  }

  
  public startMix1Input(){
    var el = document.getElementById("rect");
    var inside : boolean = false;

    this.interval = setInterval(() => {
      if(el){
        inside = this.eyesOnlyInput.checkIfInsideElement(el);
      }
      if (inside == true && el){ //click, Problem mit interval wenn nicht genau zum richtigen Zeitpunkt
        //eher - bei click event schauen ob augen drauf
        el.style.backgroundColor = "var(--apricot)";
      }
      else if(inside == false && el){ //Click
        el.style.backgroundColor = "var(--blue)";
      }
    }, 100);
  }

  public activateSelectedInputType(){
    if(this.selectedInputType == InputType.EYE){
      this.stopEyeInput();
      this.checkEyeInput();
    }
    if(this.selectedInputType == InputType.MOUSE){
      this.stopEyeInput();
    }
    if(this.selectedInputType == InputType.MIX1){
      this.stopEyeInput();
      this.startMix1Input();
      console.log("mix1")
    }
    if(this.selectedInputType == InputType.MIX2){
      this.stopEyeInput();
      console.log("mix2")
    }
  }

  //todo bei anderen Cimmer erst eyestop, damit intervall gecancelt





}
