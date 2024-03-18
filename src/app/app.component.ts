import { AfterViewChecked, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { InputType } from './enums/input-type';
import { Tasks } from './enums/tasks';
import { BaseTasksComponent } from './base-tasks/base-tasks.component';
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
  title = 'eye-input-webpage';
  @ViewChild(BaseTasksComponent) baseTaskComponent! : BaseTasksComponent;

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

  protected showRecalibration : boolean = false; //set false when re-calibration needed

  //calibration explanation popup
  protected showInitialExplanation : boolean = true;
  protected setShowInitialExplanation(value : boolean){
    this.showInitialExplanation = value;
  }

  //Test Mode
  protected showTestMode : boolean = false; //not needed here - test mode in seperate branch

  //task explanation
  protected showTaskPopup : boolean = false; 

  constructor(private store : Store<AppState>,
    private cdRef: ChangeDetectorRef, 
    private taskEvaluationService : TaskEvaluationService,
    protected randomizationService : RandomizationService){}
  
    ngAfterViewChecked(): void {
      this.cdRef.detectChanges();
    }
  
    ngOnInit(): void {
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
    this.cdRef.detectChanges(); //because on mouse input, calibrationDone will be changed to true
  }

  startExperiment(){
    console.log("start Exp")
    this.baseTaskComponent.showInterTrialPage(true); 
    this.randomizationService.nextRep().then(()=>{
      this.baseTaskComponent.showInterTrialPage(false);
    });
    this.baseTaskComponent.activateSelectedInputType();
    this.baseTaskComponent.showInterTrialPage(true);
  }
  
  protected skipButtonClick = () => {
    const skipButton = document.getElementById("skip");
    if(skipButton && skipButton instanceof HTMLButtonElement){
      (skipButton as HTMLButtonElement).disabled = true
      this.baseTaskComponent.skipBlock().then(
          () => (skipButton as HTMLButtonElement).disabled = false
      )
    }
    else{
      console.error("No skip button found.")
    }
  }

  blur($event : any){
    $event.target.blur();
  }

}  





