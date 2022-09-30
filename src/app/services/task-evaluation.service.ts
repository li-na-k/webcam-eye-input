import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TaskResult } from '../classes/task-result';
import { InputType } from '../enums/input-type';
import { Sizes } from '../enums/sizes';
import { Tasks } from '../enums/tasks';
import { AppState } from '../state/app.state';
import { selectInputType, selectTask } from '../state/expConditions/expconditions.selector';

type NewType = Observable<Tasks>;

@Injectable({
  providedIn: 'root'
})
export class TaskEvaluationService {

  public selectedTask : Tasks | null = null; 
  public selectedInputType : InputType | null = null; 
  public selectedTask$ : NewType = this.store.select(selectTask);
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  constructor(private store : Store<AppState>) {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
    this.selectedTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedTask = d);
   }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  public results : TaskResult[] = []; //nicht als rxjs store weil mans einfach gleich hier in eine Datei reinschreibt, es muss ja sonst von nirgendwo drauf zugegriffen werden
  private taskRunning : boolean = false;
  private errorCount : number = 0;

  startTask(){
    if(this.taskRunning){
      console.error("there is already a task running")
    }
    else{
      this.taskRunning = true;
      this.errorCount = 0;
      var result : TaskResult = new TaskResult();
      this.results.push(result);
      result.startTime = Date.now();
      result.inputType = this.selectedInputType;
      result.task = this.selectedTask;
      result.size = Sizes.M //TODO 
    }
  }

  addError(){
    if(this.taskRunning){
      this.errorCount++;
    }
    else{
      console.log("no error was added because task has not been started.")
    }
  }

  endTask(){
    if(this.taskRunning){
      var result : TaskResult = this.results[this.results.length-1]
      result.endTime = Date.now();
      result.errors = this.errorCount;
      this.taskRunning = false;
      console.log(result);
    }
    else{
      console.error("tried to end task, but no task was running.")
    }
  }

  //TODO: access end Task from base task, where error property should be increased every time error occurs and endTask should be called on success


}
