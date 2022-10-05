import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { InputType } from './enums/input-type';
import { Tasks } from './enums/tasks';

import { CalibrationComponent } from './calibration/calibration.component';
import { BaseTasksComponent } from './base-tasks/base-tasks.component';
import { WebgazerService } from 'src/app/services/webgazer.service';
import { TaskEvaluationService } from './services/task-evaluation.service';
import { RandomizationService } from './services/randomization.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'eye-input-visualization';
  @ViewChild(BaseTasksComponent) baseTaskComponent! : BaseTasksComponent;
  @ViewChild(CalibrationComponent) calibrationCmp : CalibrationComponent = new CalibrationComponent();
  
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  //enums for use in template
  public InputType = InputType;
  public TaskType = Tasks;

  //calibration status
  public calibrationDone : boolean = false;
  public showPopup = true; 

  constructor(private store : Store<AppState>, 
    public webgazerService : WebgazerService, 
    public taskEvaluationService : TaskEvaluationService,
    public randomizationService : RandomizationService){}

  ngOnInit(): void {
    this.webgazerService.startWebgazer();
    this.webgazerService.checkWebGazerLoaded();
    //
    this.randomizationService.messageSubject //will be emitted when nextTask is called in randmozationService
      .pipe(takeUntil(this.destroy$))
      .subscribe((message)=>{
        console.log(message);
        this.showPopup = true;
    });
  }

  ngAfterViewInit(){
    this.randomizationService.nextInputMethod();
    this.randomizationService.nextTask();
  }

  public showExplanation(){ //calibration //TODO ??
    this.calibrationCmp.showExplanation();
  }

  public setCalibrationDone(done : boolean){ //TODO ?? (siehe fkt drüber)
    this.calibrationDone = done;
  }

  confirmSelection(){
    this.baseTaskComponent.activateSelectedInputType()
  }
}  





