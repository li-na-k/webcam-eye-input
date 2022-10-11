import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, ComponentCanDeactivate{
  title = 'eye-input-visualization';
  @ViewChild(BaseTasksComponent) baseTaskComponent! : BaseTasksComponent;
  @ViewChild(CalibrationComponent) calibrationCmp : CalibrationComponent = new CalibrationComponent();

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    return false;
  }
  
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  //enums for use in template
  public InputType = InputType;
  public TaskType = Tasks;

  //calibration status
  public calibrationDone : boolean = false;
  public showTaskPopup = true; 
  public showCalibrationPopup = true;

  constructor(private store : Store<AppState>, 
    public webgazerService : WebgazerService, 
    public taskEvaluationService : TaskEvaluationService,
    public randomizationService : RandomizationService){}

  ngOnInit(): void {
    this.webgazerService.startWebgazer();
    this.webgazerService.checkWebGazerLoaded();
    this.randomizationService.messageSubject //will be emitted when nextTask is called in randmozationService
      .pipe(takeUntil(this.destroy$))
      .subscribe(()=>{
        if(this.baseTaskComponent){
          this.baseTaskComponent.stopAllInputs(); //so pop-up can be clicked normally
        }
        this.showTaskPopup = true;
    });
  }

  ngAfterViewInit(){
    this.randomizationService.nextInputMethod();
  }

  public setCalibrationDone(done : boolean){ //TODO ?? 
    this.calibrationDone = done;
    this.showCalibrationPopup = false;
  }

  confirmSelection(){
    this.baseTaskComponent.activateSelectedInputType()
  }
}  





