import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';

@Component({
  selector: 'app-base-tasks',
  templateUrl: './base-tasks.component.html',
  styleUrls: ['./base-tasks.component.css']
})
export abstract class BaseTasksComponent implements OnInit, OnDestroy {
  
  readonly InputType = InputType;
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE; 
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables
  public interval : any; //for checking if arrow cursor / gaze is inside an element
  public moveArrowinterval : any;
  public arrow : HTMLElement | null = document.getElementById("arrow");
  public sandbox : HTMLElement | null = document.getElementById("experimentSandbox");

  public timeOutAfterMouseInput : number = 1500; //TODO: ev. überschreiben je Komponent?

  constructor(protected store : Store<AppState>, private cdRef: ChangeDetectorRef) { }  
  
  ngOnInit(): void {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
  }

  ngAfterViewInit(){
    this.activateSelectedInputType();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  abstract startEyeInput() : void;
  abstract startMouseInput() : void;
  abstract startMix1Input() : void;
  abstract startMix2Input() : void;
  abstract stopOtherInputs() : void;

  public activateSelectedInputType(){
    this.cdRef.detectChanges();
    this.stopOtherInputs();
    if(this.selectedInputType == InputType.EYE){
      this.startEyeInput();
    }
    if(this.selectedInputType == InputType.MOUSE){
      this.startMouseInput()
    }
    if(this.selectedInputType == InputType.MIX1){
      this.startMix1Input();
    }
    if(this.selectedInputType == InputType.MIX2){
      this.startMix2Input();
    }
  }


  public changeApricot(el : HTMLElement){
    el.style.backgroundColor = "var(--apricot)";
  }
  
  public changeBlue(el : HTMLElement){
    el.style.backgroundColor = "var(--blue)";
  }
}
