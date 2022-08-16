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



  public checkEyeInput(){
    var scrollAreas = document.getElementsByClassName("scroll-area");
    var inside : boolean = false;
    this.interval = setInterval(() => {
      for(var i = 0; i < scrollAreas.length; i++){
        var el : HTMLElement = scrollAreas[i] as HTMLElement;
    
        if(el){
          inside = this.eyesOnlyInput.checkIfInsideElement(el);
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

  public stopEyeInput(){
    clearInterval(this.interval);
  }

  public activateSelectedInputType(){
    if(this.selectedInputType == InputType.EYE){
      this.checkEyeInput();
    }
    if(this.selectedInputType == InputType.MOUSE){
      this.stopEyeInput();
    }
    if(this.selectedInputType == InputType.MIX1){
      console.log("mix1")
    }
    if(this.selectedInputType == InputType.MIX2){
      console.log("mix2")
    }
  }
}






    

