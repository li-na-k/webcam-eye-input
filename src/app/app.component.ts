import { AfterViewChecked, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { InputType } from './enums/input-type';
import { Tasks } from './enums/tasks';

import { CalibrationComponent } from './calibration/calibration.component';
import { BaseTasksComponent } from './base-tasks/base-tasks.component';
import { TaskEvaluationService } from './services/task-evaluation.service';
import { RandomizationService } from './services/randomization.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ComponentCanDeactivate } from './component-can-deactivate';
import { selectInputType, selectTask } from './state/expConditions/expconditions.selector';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, ComponentCanDeactivate, AfterViewChecked{
  title = 'eye-input-webpage';
  @ViewChild(BaseTasksComponent) baseTaskComponent! : BaseTasksComponent;
  //@ViewChild(CalibrationComponent) calibrationCmp : CalibrationComponent = new CalibrationComponent(this.webgazerService);

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    return false;
  }
  
  protected selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  protected selectedInputType : InputType = InputType.EYE; 
  protected selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  protected selectedTask : Tasks = Tasks.SELECT; 
  private destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  //enums for use in template
  protected InputType = InputType;
  protected TaskType = Tasks;

  //calibration status
  protected calibrationDone : boolean = false;
  //calibration explanation popup
  protected showCalibExplanation : boolean = true;

  //Test Mode
  protected showTestMode : boolean = false; //TODO!

  //task explanation
  protected showTaskPopup : boolean = false; 
  protected showInputMethodPopup : boolean = true;

  constructor(private store : Store<AppState>,
    private cdRef: ChangeDetectorRef, 
    private taskEvaluationService : TaskEvaluationService,
    protected randomizationService : RandomizationService,
    private webSocketService : SocketService){}
  
    ngAfterViewChecked(): void {
      this.cdRef.detectChanges();
    }
  
    ngOnInit(): void {
    this.webSocketService.startSendingGazeData();
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
    this.calibrationDone = false; //not using this.setCalibrationDone(false) here because in the beginning a calibration is needed (for test mode) even if first input is mouse
    this.cdRef.detectChanges(); //because on mouse input, calibrationDone will be changed to true
  }

  protected updateCalibrationDone(done : boolean){ 
    if(done){ //calibration should NOT be shown next task
      this.calibrationDone = true;
      this.showCalibExplanation = false; //as soon as (first) calibration is done: explanation will not be shown second time
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

  ngOnDestroy() {
    this.webSocketService.stopSendingGazeData();
  }

  confirmSelection(){
    this.baseTaskComponent.activateSelectedInputType();
    this.taskEvaluationService.startTask();
  }

  blur($event : any){
    $event.target.blur();
  }

}  





