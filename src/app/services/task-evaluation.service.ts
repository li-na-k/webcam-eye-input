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
import { Positions } from '../enums/positions';

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

  public results : TaskResult[] = []; //nicht als rxjs store weil mans einfach gleich hier in eine Datei reinschreibt, es muss ja sonst von nirgendwo drauf zugegriffen werden
  private taskRunning : boolean = false;
  private errorCount : number = 0;
  public selectedSize : Sizes = Sizes.S; //set by randomization Service
  public targetOnMainScreen : boolean = false; //set by randomization Service
  public pos : Positions = Positions.POS1; //set by randomization Service

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
      result.targetOnMainScreen = this.targetOnMainScreen;
      result.pos = this.pos;
      result.eyeMouseDistribution = [];
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

  endEyeMouseInterval(){ //only for Mix2 input!
    if(this.taskRunning){
      let result : TaskResult = this.results[this.results.length-1] //current result object
      if(result.eyeMouseDistribution){
        let prevIntervalsDur = result.eyeMouseDistribution.reduce((a, b) => a + b, 0);
        let duration : number = Date.now() - (result.startTime + prevIntervalsDur)
        result.eyeMouseDistribution?.push(duration);
      }
    }
  }

  addScreenChange(){
    if(this.taskRunning){
      let result : TaskResult = this.results[this.results.length-1]; //current result object
      let lastChange : number = result.screenChanges.length==0?0:result.screenChanges[result.screenChanges.length-1]
      let currentChange : number = Date.now()-result.startTime;
      if(!(currentChange - lastChange < 50)){
        result.screenChanges.push(currentChange);
      }
    }
  }

  endTask(aborted? : boolean){
    if(this.taskRunning){
      let result : TaskResult = this.results[this.results.length-1]
      result.endTime = Date.now();
      result.setDuration();
      result.errors = this.errorCount;
      this.endEyeMouseInterval(); //end last MOUSE interval (during Mix2 only)
      this.taskRunning = false;
      this.playAudio();
      if(aborted){
        result.aborted = aborted;
      }
      if(result.eyeMouseDistribution){
        result.eyeIntervalsDuration = result.eyeMouseDistribution.reduce((sum, val, i) => sum + ((i % 2 == 0) ? val : 0), 0);
        result.mouseIntervalsDuration = result.eyeMouseDistribution.reduce((sum, val, i) => sum + ((i % 2 != 0) ? val : 0), 0);
        result.intervalChanges = result.eyeMouseDistribution.length-1;
      }
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

  prevDistToScreen = [0,0];
  calculateTargetDistance(target : HTMLElement, window : Window){ //!! needs to be adapted depending whether top-bottom or left-right setup, only works when target is alternating between screens, gap between screens not considered
    console.log("previous", this.prevDistToScreen)
    if(this.taskRunning){
      let result : TaskResult = this.results[this.results.length-1]; //current result object#
      //!! with main screen on the left
      /* let XdistToBorder = 0;
      if(result.targetOnMainScreen){ //left screen
        XdistToBorder = Math.round(window.innerWidth) - Math.round(target.getBoundingClientRect().right);
      }
      else{ //right screen
        XdistToBorder = Math.round(target.getBoundingClientRect().left);
      }
      let verticalDist = Math.round(target.getBoundingClientRect().top);
      result.XdistancePrevTarget = XdistToBorder + this.prevDistToScreen[0];
      result.YdistancePrevTarget = this.prevDistToScreen[1] - verticalDist //neg value = below prev*/
      

      //!! with main screen below other
      let YdistToBorder = 0;
      if(result.targetOnMainScreen){ //bottom screen
        YdistToBorder = Math.round(window.innerHeight) - Math.round(target.getBoundingClientRect().top);
      }
      else{ //top screen
        YdistToBorder = Math.round(target.getBoundingClientRect().bottom);
      }
      
      let horizontalDist = Math.round(target.getBoundingClientRect().right);
      result.YdistancePrevTarget = YdistToBorder + this.prevDistToScreen[0];
      result.XdistancePrevTarget = this.prevDistToScreen[1] - horizontalDist //neg value = below prev*/
      this.prevDistToScreen = [horizontalDist, YdistToBorder];

    }
  }

  exportResults(){
    this.exportToCsv(this.results, "myresults", [
      "task",
      "inputType",
      "size",
      "duration",
      "errors",
      "aborted",
      "screenChanges",
      "targetOnMainScreen",
      "pos",
      "XdistancePrevTarget",
      "YdistancePrevTarget",
      "eyeMouseDistribution",
      "mouseIntervalsDuration",
      "eyeIntervalsDuration",
      "intervalChanges"
    ]);
  }

  //source: https://dev.to/idrisrampurawala/exporting-data-to-excel-and-csv-in-angular-3643#export-to-csv
  public exportToCsv(rows: TaskResult[], fileName: string, columns?: string[]): string | void {
    if (!rows || !rows.length) {
      console.error("No results data found.")
      return;
    }
    const separator = ';';
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
    this.saveAsFile(csvContent, "experimentResults" + ".csv", "csv");
  }

  private saveAsFile(buffer: any, fileName: string, fileType: string): void {
    const data: Blob = new Blob([buffer], { type: fileType });
    FileSaver.saveAs(data, fileName);
  }

}
