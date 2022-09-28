import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';

declare var webgazer: any;
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
  abstract stopAllInputs() : void;

  public activateSelectedInputType(){
    webgazer.resume();
    document.getElementById("webgazerGazeDot")!.style.display = "block";
    this.cdRef.detectChanges();
    this.stopAllInputs();
    if(this.selectedInputType == InputType.EYE){
      this.startEyeInput();
    }
    if(this.selectedInputType == InputType.MOUSE){
      webgazer.pause();
      document.getElementById("webgazerGazeDot")!.style.display = "none";
      this.startMouseInput()
    }
    if(this.selectedInputType == InputType.MIX1){
      this.startMix1Input();
    }
    if(this.selectedInputType == InputType.MIX2){
      this.startMix2Input();
    }
  }
}
