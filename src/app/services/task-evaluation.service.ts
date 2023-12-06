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
import { Screens } from '../enums/screens';

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
      this.playAudio("assets/success.mp3");
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

  public playAudio(src : string) : Promise<Event>{
    return new Promise(function(resolve, reject){
      let audio = new Audio();
      audio.preload = "auto";
      audio.src = src; /* source: http://freesoundeffect.net/sound/correct-answer-bling-1-sound-effect */
      audio.load();
      audio.play();
      audio.onerror = reject;
      audio.onended = resolve; 
    })
  }

  prevDistToScreen : [number, number]= [0,0];
  prevScreen : Screens = Screens.MAINSCREEN;
  calculateTargetDistance(target : HTMLElement, window : Window){ //!! needs to be adapted depending whether top-bottom or left-right setup
    console.log("previous", this.prevDistToScreen)
    if(this.taskRunning){
      let result : TaskResult = this.results[this.results.length-1]; //current result object#
      //!! with main screen below other (only works when target is alternating between screens)
      // let YdistToBorder = 0;
      // if(result.targetOnMainScreen){ //bottom screen
      //   YdistToBorder = Math.round(window.innerHeight) - Math.round(target.getBoundingClientRect().top);
      // }
      // else{ //top screen
      //   YdistToBorder = Math.round(target.getBoundingClientRect().bottom);
      // }
      
      // let XdistToBorder = Math.round(target.getBoundingClientRect().right);
      // result.YdistancePrevTarget = YdistToBorder + this.prevDistToScreen[0];
      // result.XdistancePrevTarget = this.prevDistToScreen[1] - XdistToBorder //neg value = below prev*/

      //!! with main screen on the left
      let XdistToBorder = 0;
      let targetXCenter = Math.round(target.getBoundingClientRect().right - target.getBoundingClientRect().left); //left Border to center
      if(result.targetOnMainScreen){ //left screen -> dist to right boarder
        XdistToBorder = Math.round(window.innerWidth) - targetXCenter;
      }
      else{ //right screen -> dist to left boarder
        XdistToBorder = targetXCenter;
      }
      let YDistToBorder = Math.round(target.getBoundingClientRect().top);
      if(result.targetOnMainScreen == (this.prevScreen == Screens.MAINSCREEN)){ //check if screen changes
        result.XdistancePrevTarget = this.prevDistToScreen[0] - XdistToBorder; // neg value = left to prev
      }
      else{
        result.XdistancePrevTarget = XdistToBorder + this.prevDistToScreen[0];
      }
      result.YdistancePrevTarget = this.prevDistToScreen[1] - YDistToBorder; //neg value = below prev
      
      this.prevDistToScreen = [XdistToBorder, YDistToBorder]; //depending on which screen: xDistToBorder is either dist to left or dist to right
      this.prevScreen = result.targetOnMainScreen?Screens.MAINSCREEN:Screens.SECONDSCREEN;
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
