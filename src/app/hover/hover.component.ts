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

public stopEyeInput(){
  clearInterval(this.interval);
}

public activateSelectedInputType(){
  if(this.selectedInputType == InputType.EYE){
    this.stopEyeInput();
    this.checkEyeInput();
  }
  if(this.selectedInputType == InputType.MOUSE){
    this.stopEyeInput();
    this.stopEyeInput();
  }
  if(this.selectedInputType == InputType.MIX1){
    this.stopEyeInput();
    console.log("mix1")
  }
  if(this.selectedInputType == InputType.MIX2){
    this.stopEyeInput();
    console.log("mix2")
  }
}



}


