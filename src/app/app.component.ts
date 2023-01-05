import { AfterViewChecked, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { InputType } from './enums/input-type';
import { Tasks } from './enums/tasks';

import { CalibrationComponent } from './calibration/calibration.component';
import { BaseTasksComponent } from './base-tasks/base-tasks.component';
import { WebgazerService } from 'src/app/services/webgazer.service';
import { TaskEvaluationService } from './services/task-evaluation.service';
import { RandomizationService } from './services/randomization.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ComponentCanDeactivate } from './component-can-deactivate';
import { selectInputType, selectTask } from './state/expConditions/expconditions.selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, ComponentCanDeactivate, AfterViewChecked{
  title = 'eye-input-visualization';
  @ViewChild(BaseTasksComponent) baseTaskComponent! : BaseTasksComponent;
  @ViewChild(CalibrationComponent) calibrationCmp : CalibrationComponent = new CalibrationComponent();

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    return false;
  }
  
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE; 
  public selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  public selectedTask : Tasks = Tasks.SELECT; 
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  //enums for use in template
  public InputType = InputType;
  public TaskType = Tasks;

  //calibration status
  public calibrationDone : boolean = false;
  //calibration explanation popup
  protected showCalibExplanation(){
    this.calibrationCmp.showPopup = true;
  }
  public calibrationExplanationShown : boolean = false;

  //Test Mode
  public showTestMode : boolean = true;

  //task explanation
  public showTaskPopup : boolean = false; 
  public showInputMethodPopup : boolean = true;

  constructor(private store : Store<AppState>, 
    public webgazerService : WebgazerService, 
    public cdRef: ChangeDetectorRef, 
    public taskEvaluationService : TaskEvaluationService,
    public randomizationService : RandomizationService){}
  
    ngAfterViewChecked(): void {
      this.cdRef.detectChanges();
    }
  
    ngOnInit(): void {
    this.webgazerService.startWebgazer();
    this.webgazerService.checkWebGazerLoaded();
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => {
         this.selectedInputType = d
        });
    this.selectedTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => {
        this.selectedTask = d}
        ); 
    this.randomizationService.messageSubject //will be emitted when nextTask is called in randmizationService
      .pipe(takeUntil(this.destroy$))
      .subscribe(()=>{
        if(this.baseTaskComponent){
          this.baseTaskComponent.stopAllInputs(); //so pop-up can be clicked normally
        }
        if(this.selectedTask != Tasks.TEST){ 
          this.showTaskPopup = true;
        } 
    });
  }

  ngAfterViewInit(){
    this.randomizationService.nextInputMethod();
    this.setCalibrationDone(false);
    this.cdRef.detectChanges(); //because on mouse input, calibrationDone will be changed to true
  }

  public setCalibrationDone(done : boolean){ 
    if(done){ //calibration should NOT be shown next task
      this.calibrationDone = true;
      this.calibrationExplanationShown = true; //as soon as (first) calibration is done: set explanation shown to true, so it will not be shown second time
    }
    else{ //SHOW calibration next task
      if(this.selectedInputType == InputType.MOUSE){ 
        this.calibrationDone = true; //no calibration needed if mouse input
      }
      else{
        this.calibrationDone = false;
      }
    }
  }

  confirmSelection(){
    this.baseTaskComponent.activateSelectedInputType();
    this.taskEvaluationService.startTask();
  }

  blur($event : any){
    $event.target.blur();
  }
  
  public enteredUserID: string = "";
  public userIDSubmitted : boolean = false;

  userIDSubmit(){
    this.taskEvaluationService.userID = this.enteredUserID;
    this.userIDSubmitted = true;
  }
}  





