import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType, selectTask } from '../state/expConditions/expconditions.selector';
import { Tasks } from '../enums/tasks';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';

@Component({
  selector: 'app-base-tasks',
  templateUrl: './base-tasks.component.html',
  styleUrls: ['./base-tasks.component.css']
})
export abstract class BaseTasksComponent implements OnInit, OnDestroy {

  public abstract secondWindowLoaded : boolean;

  readonly InputType = InputType;
  protected selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  protected selectedInputType : InputType = InputType.EYE; 
  protected destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables
  protected moveArrowinterval : any;
  protected mainScreen_arrow : HTMLElement | null = document.getElementById("arrow");

  protected timeOutAfterMouseInput : number = 500;

  protected selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  protected selectedTask : Tasks = Tasks.SELECT; 

  constructor(protected store : Store<AppState>, 
    protected cdRef: ChangeDetectorRef, 
    protected taskEvaluationService : TaskEvaluationService, //will be used in derived classes
    protected randomizationService : RandomizationService) { }  
  
  ngOnInit(): void {
    this.checkPointerLock();
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
  }

  ngOnDestroy(): void {
    clearInterval(this.pointerLockInterval);
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  protected abstract startEyeInput() : void;
  protected abstract startMouseInput() : void;
  protected abstract startMix1Input() : void;
  protected abstract startMix2Input() : void;
  abstract stopAllInputs() : void;
  abstract addSuccess(aborted?: boolean) : void;



  public activateSelectedInputType(){
    console.log("activate selected input type: ", this.selectedTask + " " + this.selectedInputType);
    this.cdRef.detectChanges();
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

  protected mix2loaded = false;
  private pointerLockInterval : any = undefined;
  protected pointerLockStopped = false;

  private checkPointerLock(){
      this.pointerLockInterval = setInterval(() => {
        if(this.mix2loaded && document.pointerLockElement == null){
          this.pointerLockStopped = true;
          console.log("pointer lock zero!")
        }
        else{
          this.pointerLockStopped = false;
        }
      },2000)
  }
}
