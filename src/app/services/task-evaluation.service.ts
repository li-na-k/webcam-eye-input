import { Injectable, OnDestroy } from '@angular/core';
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
export class TaskEvaluationService implements OnDestroy {

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
    this.clearMouseStartStop();
  }

  public results : TaskResult[] = []; //nicht als rxjs store weil mans einfach gleich hier in eine Datei reinschreibt, es muss ja sonst von nirgendwo drauf zugegriffen werden
  private taskRunning : boolean = false;
  private errorCount : number = 0;
  public selectedSize : Sizes = Sizes.S; //set by randomization Service
  public numberInBlock : number = 0; //set by randomization Service
  public targetOnMainScreen : boolean = false; //set by randomization Service
  public pos : Positions = Positions.POS1; //set by randomization Service

  // for mouse eye distribution detection
  private intervalStartTime: number | null = null;
  private isMouseMoving: boolean = false;
  private timeoutId: any;
  private result : TaskResult | null = null;

  startTask(){
    console.log("--start task--")
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
      result.numberInBlock = this.numberInBlock;
      result.targetOnMainScreen = this.targetOnMainScreen;
      result.positionOnScreen = this.pos;
      result.setPosNumber();
      result.eyeMouseDistribution = [];
      this.intervalStartTime = result.startTime;
      this.result = result;
      this.isMouseMoving = false;
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

  // called on every mouse move
  evaluateMouseStartStop(timeout: number) {
    const currentTime = Date.now();
    // mouse was not moving before - start a new mouse interval & end previous eye interval
    if (!this.isMouseMoving) {
      if (this.intervalStartTime !== null) { //if a task is running
        const eyeIntervalDuration = currentTime - this.intervalStartTime;
        this.result?.eyeMouseDistribution.push(eyeIntervalDuration);
      }
      this.isMouseMoving = true;
      this.intervalStartTime = currentTime;
    }
    // end current mouse interval if timeout is reached
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      if(this.isMouseMoving){
        const mouseIntervalDuration = Date.now() - this.intervalStartTime!;
        this.result?.eyeMouseDistribution.push(mouseIntervalDuration);
        this.isMouseMoving = false;
        this.intervalStartTime = Date.now(); // new start time for the next eye interval
      }
    }, timeout);
  }

  //end last interval and clear interval detection
  clearMouseStartStop() {
      const currentTime = Date.now();
      // Close the last interval
      if (this.intervalStartTime !== null) {
        const finalIntervalDuration = currentTime - this.intervalStartTime;
        this.result?.eyeMouseDistribution.push(finalIntervalDuration);
      }
      else {
        console.error("Could not close LAST mouse interval because intervalStartTime was null.")
        return;
      }
      // Clear any active timeout and reset state for a new task
      this.intervalStartTime = null;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.isMouseMoving = false;
  }

  addScreenChange(){
    if(this.taskRunning){
      //let result : TaskResult = this.results[this.results.length-1]; //current result object
      let lastChange : number = this.result!.screenChanges.length==0?0:this.result!.screenChanges[this.result!.screenChanges.length-1]
      let currentChange : number = Date.now()-this.result!.startTime;
      if(!(currentChange - lastChange < 50)){
        this.result!.screenChanges.push(currentChange);
      }
    }
  }

  endTask(aborted? : boolean){
    if(this.taskRunning){
      this.result!.endTime = Date.now();
      this.clearMouseStartStop(); //end last MOUSE interval (during Mix2 only)
      this.result!.setDuration();
      this.result!.setPosNumber();
      this.result!.setIndexOfDifficulty();
      this.result!.errors = this.errorCount;
      this.taskRunning = false;
      this.playAudio("assets/success.mp3");
      if(aborted){
        this.result!.aborted = aborted;
      }
      if(this.result!.eyeMouseDistribution){
        this.result!.eyeIntervalsDuration = this.result!.eyeMouseDistribution.reduce((sum, val, i) => sum + ((i % 2 == 0) ? val : 0), 0);
        this.result!.mouseIntervalsDuration = this.result!.eyeMouseDistribution.reduce((sum, val, i) => sum + ((i % 2 != 0) ? val : 0), 0);
        this.result!.intervalChanges = this.result!.eyeMouseDistribution.length-1;
      }
      console.log(this.result);
      this.result = null;
    }
    else{
      console.error("tried to end task, but no task was running.")
    }
  }

  public playAudio(src : string) : Promise<Event>{
    return new Promise(function(resolve, reject){
      let audio : HTMLAudioElement = new Audio();
      audio.preload = "auto";
      audio.src = src; /* source: http://freesoundeffect.net/sound/correct-answer-bling-1-sound-effect */
      audio.load();
      audio.play();
      audio.onerror = reject;
      audio.onended = resolve; 
    })
  }




  targetsOnYaxis = false; //specify here whether a setup with the second screen above or on the left is used
  prevDistanceToBorder : [number, number, number, number] = [0,0,0,0]; //[targetCenterFromTop, targetCenterToBottom, targetCenterFromLeft, targetCenterToRight]
  prevScreen : Screens = Screens.MAINSCREEN;
  calculateTargetDistance(target : HTMLElement, window : Window){
    if (!this.taskRunning) {
      console.error("DOM may not have loaded yet. No target distance was calculated.");
      return;
    }
    // let result : TaskResult = this.results[this.results.length-1]; //current result object

    const targetRect = target.getBoundingClientRect();

    const targetCenterFromTop = this.targetsOnYaxis ? (Math.round(targetRect.top + 0.5 * (targetRect.bottom - targetRect.top))) : 0; // Center position from top ↓
    const targetCenterToBottom = this.targetsOnYaxis ? (Math.round(window.innerHeight - targetCenterFromTop)) : 0; // Center position to bottom of the window ↓
    const targetCenterFromLeft = this.targetsOnYaxis ? 0 : Math.round(targetRect.left + 0.5 * (targetRect.right - targetRect.left)); // Center position from left →
    const targetCenterToRight = this.targetsOnYaxis ? 0 : Math.round(window.innerWidth - targetCenterFromLeft); // Center position to right of the window →

    const isSameScreen = this.result!.targetOnMainScreen == (this.prevScreen == Screens.MAINSCREEN)

    if(isSameScreen){
      this.result!.YdistancePrevTarget = Math.abs(this.prevDistanceToBorder[0] - targetCenterFromTop);
      this.result!.XdistancePrevTarget = Math.abs(this.prevDistanceToBorder[2] - targetCenterFromLeft);
    }
    else{
      if(this.result!.targetOnMainScreen){ // from second screen to main screen: ↓ or →
        this.result!.YdistancePrevTarget = this.prevDistanceToBorder[1] + targetCenterFromTop;
        this.result!.XdistancePrevTarget = this.prevDistanceToBorder[3] + targetCenterFromLeft;
      }
      else{ // from main screen to second screen: ↑ or ← 
        this.result!.YdistancePrevTarget = this.prevDistanceToBorder[0] + targetCenterToBottom;
        this.result!.XdistancePrevTarget = this.prevDistanceToBorder[2] + targetCenterToRight;
      }
    }
    this.prevDistanceToBorder = [targetCenterFromTop, targetCenterToBottom, targetCenterFromLeft, targetCenterToRight];
    this.prevScreen = this.result!.targetOnMainScreen?Screens.MAINSCREEN:Screens.SECONDSCREEN;
  }

  calculateTargetSize(target : HTMLElement){
    const targetRect = target.getBoundingClientRect();
    this.result!.targetWidth = targetRect.width;
    this.result!.targetHeight = targetRect.height;
  }

  exportResults(){
    this.exportToCsv(this.results, "myresults", [
      "task",
      "inputType",
      "size",
      "numberInBlock",
      "duration",
      "durationPerPixel",
      "errors",
      "aborted",
      "screenChanges",
      "targetOnMainScreen",
      "positionOnScreen",
      "posNumber",
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
