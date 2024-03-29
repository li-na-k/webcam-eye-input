import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TaskResult } from '../classes/task-result';
import { InputType } from '../enums/input-type';
import { Sizes } from '../enums/sizes';
import { Tasks } from '../enums/tasks';
import { AppState } from '../state/app.state';
import { selectInputType, selectTask } from '../state/expConditions/expconditions.selector';
import * as FileSaver from 'file-saver';

type NewType = Observable<Tasks>;

@Injectable({
  providedIn: 'root'
})
export class TaskEvaluationService {

  private selectedTask : Tasks | null = null; 
  private selectedInputType : InputType | null = null; 
  private selectedTask$ : NewType = this.store.select(selectTask);
  private selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  private destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

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

  public userID : string | null = null;
  public results : TaskResult[] = []; //nicht als rxjs store weil mans einfach gleich hier in eine Datei reinschreibt, es muss ja sonst von nirgendwo drauf zugegriffen werden
  private taskRunning : boolean = false;
  private errorCount : number = 0;
  public selectedSize : Sizes = Sizes.S; //set by randomization Service

  startTask(){
    if(this.taskRunning){
      console.info("there is already a task running")
    }
    else{
      this.taskRunning = true;
      this.errorCount = 0;
      let result : TaskResult = new TaskResult();
      this.results.push(result);
      result.startTime = Date.now();
      result.inputType = this.selectedInputType;
      result.task = this.selectedTask;
      result.size = this.selectedSize;
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

  endTask(aborted? : boolean){
    if(this.taskRunning){
      let result : TaskResult = this.results[this.results.length-1]
      result.endTime = Date.now();
      result.setDuration();
      result.errors = this.errorCount;
      if(aborted){
        result.aborted = aborted;
      }
      this.taskRunning = false;
      this.playAudio();
      console.log(result);
    }
    else{
      console.log("tried to end task, but no task was running.")
    }
  }

  public playAudio(){
    let audio = new Audio();
    audio.src = "assets/success.mp3"; /* source: http://freesoundeffect.net/sound/correct-answer-bling-1-sound-effect */
    audio.load();
    audio.play();
  }

  exportResults(){
    this.exportToCsv(this.results, "myresults", ["task", "inputType", "size", "duration", "errors", "aborted"]);
  }

  //source: https://dev.to/idrisrampurawala/exporting-data-to-excel-and-csv-in-angular-3643#export-to-csv 
  public exportToCsv(rows: TaskResult[], fileName: string, columns?: string[]): string | void {
    if (!rows || !rows.length) {
      console.error("No results data found.")
      return;
    }
    const separator = ',';
    const keys : string[] = Object.keys(rows[0]).filter(k => {
      if (columns?.length) { //columns specified?
        return columns.includes(k);
      } else {
        return true; //return all
      }
    });
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let key = k as keyof TaskResult;
          let cell = row[key] === null || row[key] === undefined ? '' : row[key];
          return cell;
        }).join(separator);
      }).join('\n');
    this.saveAsFile(csvContent, this.userID + ".csv", "csv"); 
  }

  private saveAsFile(buffer: any, fileName: string, fileType: string): void {
    const data: Blob = new Blob([buffer], { type: fileType });
    FileSaver.saveAs(data, fileName);
  }

}
