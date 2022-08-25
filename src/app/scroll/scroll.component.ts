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
  


  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {
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

  public scrollAreas = document.getElementsByClassName("scroll-area");

  public checkEyeInput(){
    var inside : boolean = false;
    this.interval = setInterval(() => {
      for(var i = 0; i < this.scrollAreas.length; i++){
        var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
    
        if(el){
          inside = this.eyesOnlyInput.areEyesInsideElement(el);
        }
        if (inside == true && el){
          if(el.classList.contains("bottom")){
            window.scrollBy(0, 10);
          }
          if(el.classList.contains("top")){
            window.scrollBy(0, -10);
          }
          if(el.classList.contains("left")){
            window.scrollBy(-10, 0);
          }
          if(el.classList.contains("right")){
            window.scrollBy(10, 0);
          }
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
          if(el.classList.contains("bottom")){
            window.scrollBy(0, 10);
          }
          if(el.classList.contains("top")){
            window.scrollBy(0, -10);
          }
          if(el.classList.contains("left")){
            window.scrollBy(-10, 0);
          }
          if(el.classList.contains("right")){
            window.scrollBy(10, 0);
          }
        }
      }
    }
  }
}

public stopOtherInputs(){
  window.scrollTo(0,0);
  //end Eye Input
  clearInterval(this.interval);
  //end Mix1 click event
  document.body.removeEventListener('keydown', this.binded_startMix1Input);
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
    console.log("mix2")
    //TODO
  }
}
}






    

