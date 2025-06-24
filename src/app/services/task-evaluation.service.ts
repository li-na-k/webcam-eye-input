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
  public selectedSize : Sizes = Sizes.S; //set by randomization Service
  public numberInBlock : number = 0; //set by randomization Service
  public targetOnMainScreen : boolean = false; //set by randomization Service
  public pos : Positions = Positions.POS1; //set by randomization Service
  public repeated : boolean = false; //set by randomization Service

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
      result.repeated = this.repeated;
      this.intervalStartTime = result.startTime;
      this.result = result;
      this.isMouseMoving = false;
    }
  }


  // called on every mouse move
  evaluateMouseStartStop() {
    const timeout = 1000; // how long can mouse be unmoved until it is considered to be eye input? (MAGIC uses eye input after 1000 ms -> using this for evaluation too)
    const currentTime = Date.now();
    // mouse was not moving before - start a new mouse interval & end previous eye interval
    if (!this.isMouseMoving) {
      if (this.intervalStartTime !== null) { //if a task is running
        const eyeIntervalDuration = currentTime - this.intervalStartTime;
        this.result?.eyeMouseDistribution.push(eyeIntervalDuration);
        // console.log("--------- start mouse---------")
      }
      this.isMouseMoving = true;
      this.intervalStartTime = currentTime;
    }
    // end current mouse interval if timeout is reached
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      if(this.isMouseMoving){ // mouse was moving before
        const mouseIntervalDuration = Date.now() - this.intervalStartTime!;
        this.result?.eyeMouseDistribution.push(mouseIntervalDuration);
        this.isMouseMoving = false;
        this.intervalStartTime = Date.now(); // new start time for the next eye interval
        // console.log("______________ end mouse _____________________")
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
        // console.log("______________ end mouse _____________________")
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
      this.clearMouseStartStop(); //end last MOUSE interval (during Magic only)
      this.result!.setDuration();
      this.result!.setPosNumber();
      this.result!.setIndexOfDifficulty();
      this.taskRunning = false;
      if(aborted){
        this.result!.aborted = aborted;
      }
      this.result!.setIntervalDurations();
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

  //! mainScreen currently on bottom right
  prevDistanceToBorder : [number, number, number, number] = [0,0,0,0]; //[targetCenterFromTop, targetCenterToBottom, targetCenterFromLeft, targetCenterToRight]
  prevScreen : Screens = Screens.MAINSCREEN;
  calculateTargetDistance(target : HTMLElement, window : Window){
    if (!this.taskRunning) {
      console.error("DOM may not have loaded yet. No target distance was calculated.");
      return;
    }
    console.log("window pixel size", window.devicePixelRatio)
    
    const overlapVertical = 250; // if screens are not "corner to corner": enter vertical overlap here
    /* TODO: test this -> measure real dist in cm! (for comparison with 100px measure alignment line) */

    const targetRect = target.getBoundingClientRect();

    const targetCenterFromTop = Math.round(targetRect.top + 0.5 * (targetRect.bottom - targetRect.top)); // Center position from top ↓
    const targetCenterToBottom = Math.round(window.innerHeight - targetCenterFromTop); // Center position to bottom of the window ↓
    const targetCenterFromLeft = Math.round(targetRect.left + 0.5 * (targetRect.right - targetRect.left)); // Center position from left →
    const targetCenterToRight = Math.round(window.innerWidth - targetCenterFromLeft); // Center position to right of the window →

    const isSameScreen = this.result!.targetOnMainScreen == (this.prevScreen == Screens.MAINSCREEN)

    if(isSameScreen){
      this.result!.YdistancePrevTarget = Math.abs(this.prevDistanceToBorder[0] - targetCenterFromTop);
      this.result!.XdistancePrevTarget = Math.abs(this.prevDistanceToBorder[2] - targetCenterFromLeft);
    }
    else{
      if(this.result!.targetOnMainScreen){ // from second screen to main screen: ↓ or →
        this.result!.YdistancePrevTarget = this.prevDistanceToBorder[1] + targetCenterFromTop - overlapVertical;
        this.result!.XdistancePrevTarget = this.prevDistanceToBorder[3] + targetCenterFromLeft;
      }
      else{ // from main screen to second screen: ↑ or ← 
        this.result!.YdistancePrevTarget = this.prevDistanceToBorder[0] + targetCenterToBottom - overlapVertical;
        this.result!.XdistancePrevTarget = this.prevDistanceToBorder[2] + targetCenterToRight;
      }
    }
    this.prevDistanceToBorder = [targetCenterFromTop, targetCenterToBottom, targetCenterFromLeft, targetCenterToRight];
    this.prevScreen = this.result!.targetOnMainScreen?Screens.MAINSCREEN:Screens.SECONDSCREEN;
    console.log("distance", this.result!.XdistancePrevTarget)
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
      "repeated",
      "screenChanges",
      "targetOnMainScreen",
      "positionOnScreen",
      "posNumber",
      "XdistancePrevTarget",
      "YdistancePrevTarget",
      "eyeMouseDistribution",
      "mouseIntervalsDuration",
      "eyeIntervalsDuration",
      "intervalChanges",
      "targetWidth",
      "targetHeight",
      "indexOfDifficulty"  
    ]);
  }

  /* 
•	inputType – Mouse, Ninja (NINJA), or Magic (MAGIC)
•	Task – in our experiment this will always be “Select”
•	Size – large or small (exact size see targetWidth / targetHeight)	
•	numberInBlock – is it the first (0), second (1), third (2), or fourth (3) of the order / block?
•	Duration – duration between task onset and click	
•	durationPerPixel – duration relative to the distance to the previous target (we will not analyse the first target since here, we do not have a previous target)	
•	repeated – if the participant makes an error (clicks on the wrong target) the whole block will be aborted (skip directly to next order block). The whole block will be repeated at the end of the experiment and all these repetitions will have repeated = true
•	aborted – will be true for repetitions where an error occurred (in this case the rest of the block will be skipped, and all remaining repetitions will also have aborted = true)
•	screenChanges - (will only be tracked for screenChanges that were done via eye tracking)
•	targetOnMainScreen – was the target on the bottom screen?
•	positionOnScreen – left (1) or right (2) target on the screen?
•	posNumber – the number displayed on the target (1, 2, 3, or 4)
•	XdistancePrevTarget – distance in x direction to the previous target. I calculate this considering that the main screen is at the bottom right (that's the setup that was most common in the interviews, right?)
•	YdistancePrevTarget- distance in y direction to the previous target. I calculate this considering that the main screen is at the bottom right (that's the setup that was most common in the interviews, right?)
•	targetWidth – should be the same as targetHeight (either 50 or 100 px at the moment)
•	targetHeight - should be the same as targetWidth (either 50 or 100 px at the moment)
•	indexOfDifficulty - calcualtion see corresponding function in this file
•	eyeMouseDistribution – only for input methods that contain gaze: at what points in time did participants switch between eye and mouse input?
•	eyeIntervalsDuration – total duration during which eye input was used
•	mouseIntervalsDuration – total duration during which mouse input was used
•	intervalChanges – how often did they change between eye and mouse input?
  */

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
