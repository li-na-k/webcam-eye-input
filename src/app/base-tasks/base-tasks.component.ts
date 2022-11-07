import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { TaskResult } from '../classes/task-result';
import { WebgazerService } from '../services/webgazer.service';
import { AppState } from '../state/app.state';
import { selectInputType, selectTask } from '../state/expConditions/expconditions.selector';
import { Tasks } from '../enums/tasks';
import { Sizes } from '../enums/sizes';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';

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
  public moveArrowinterval : any;
  public arrow : HTMLElement | null = document.getElementById("arrow");
  public sandbox : HTMLElement | null = document.getElementById("experimentSandbox");

  public timeOutAfterMouseInput : number = 500; //TODO: ev. überschreiben je Komponent?

  public selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  public selectedTask : Tasks = Tasks.HOVER; 

  constructor(protected store : Store<AppState>, 
    public cdRef: ChangeDetectorRef, 
    public webgazerService : WebgazerService,
    public taskEvaluationService : TaskEvaluationService, //will be used in derived classes
    public randomizationService : RandomizationService) { }  
  
  ngOnInit(): void {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
    this.selectedTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedTask = d); 
  }

  ngAfterViewInit(){
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  abstract startEyeInput() : void;
  abstract startMouseInput() : void;
  abstract startMix1Input() : void;
  abstract startMix2Input() : void;
  abstract stopAllInputs() : void;
  abstract addSuccess(aborted?: boolean) : void;



  public activateSelectedInputType(){
    console.log("activate selected input type: ", this.selectedTask + " " + this.selectedInputType);
    this.webgazerService.resumeWebgazer();
    this.cdRef.detectChanges();
    this.stopAllInputs();
    if(this.selectedInputType == InputType.EYE){
      this.startEyeInput();
    }
    if(this.selectedInputType == InputType.MOUSE){
      this.webgazerService.pauseWebgazer();
      this.startMouseInput()
    }
    if(this.selectedInputType == InputType.MIX1){
      this.startMix1Input();
    }
    if(this.selectedInputType == InputType.MIX2){
      this.startMix2Input();
    }
  }

  public mix2loaded = false;
  public pointerLockedStopped() : boolean {
    if(this.selectedInputType == InputType.MIX2 && this.mix2loaded){
      return document.pointerLockElement == null;
    }
    else{
      return false;
    }   
  }
}
