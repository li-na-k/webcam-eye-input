import { ChangeDetectorRef, Component, HostListener, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
import { Sizes } from '../enums/sizes';
import { InputType } from '../enums/input-type';
import { Screens } from '../enums/screens';
import { Observable, distinctUntilChanged, takeUntil } from 'rxjs';
import { selectCurrentScreen } from '../state/eyetracking/eyetracking.selector';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-click',
  providers: [{ provide: BaseTasksComponent, useExisting: ClickComponent }],
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent extends BaseTasksComponent{
  @HostListener('body:mousemove', ['$event']) 
  onMouseMove(e : any) {
    if(this.dualscreen.getActiveScreen() == 2 && this.dualscreen.secondScreen_arrow && this.dualscreen.secondWindow){
      this.eyeInputService.moveArrowWithMouse(e, this.dualscreen.secondScreen_arrow.nativeElement, [0, this.dualscreen.secondWindow.width, this.dualscreen.secondWindow.height, 0]);
    }
    else if(this.mainScreen_arrow && this.dualscreen.mainWindow){
      this.eyeInputService.moveArrowWithMouse(e, this.mainScreen_arrow, [0, this.dualscreen.mainWindow.width, this.dualscreen.mainWindow.height, 0]);
    }
    this.eyeInputService.bound_analyseMix2; //Track mouse / eye distribution 
  }

  @ViewChild('dualscreen') dualscreen! : any;
  public override secondWindowLoaded: boolean = false;

  private className : string = "clickArea"
  private clickAreas : Array<Element> | null = null; //all target areas 
  protected Sizes = Sizes;

  private taskElementID : string = "click-task"; //area that shows success when clicked
  private taskElement : Element | null = null;
  protected clicked : boolean = false;
  protected error : boolean = false;

  private screenChangeDetection_interval : any = null;

  constructor(
    cdRef: ChangeDetectorRef, 
    private eyeInputService : EyeInputService, 
    store : Store<AppState>, 
    taskEvaluationService : TaskEvaluationService, 
    randomizationService : RandomizationService,
    private webSocketService : SocketService) {
   super(store, cdRef, taskEvaluationService, randomizationService)
  }

  private async getclickAreas() {
    try {
        const clickAreas_mainScreen = document.getElementsByClassName(this.className);
        const clickAreas_secondScreen = this.dualscreen.secondWindow.document.getElementsByClassName(this.className);
        this.clickAreas = Array.from(clickAreas_mainScreen).concat(Array.from(clickAreas_secondScreen));
        // Find target area / task element
        for (let i = 0, n = this.clickAreas.length; i < n; ++i) {
            let clickArea = this.clickAreas[i];
            if (clickArea?.id === this.taskElementID) {
                this.taskElement = clickArea;
                return; // Exit loop once the task element is found
            }
        }
        console.error("Task element with ID", this.taskElementID, "not found.");
    } catch (error) {
        console.error("An error occurred while retrieving click areas:", error);
    }
  }

  private currentScreen : Screens = Screens.MAINSCREEN;
  private currentScreen$ : Observable<any> = this.store.select(selectCurrentScreen);
  private startScreenChangeDetection() {
    console.log("screen detection started")
    this.currentScreen$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(d => {
        this.changeScreen(d)
        this.currentScreen = d;
      })
  }

  private changeScreen(toScreen : Screens){
    //jump
    this.mainScreen_arrow!.classList.remove("smoothTransition"); //jump
    this.dualscreen.secondScreen_arrow.nativeElement.classList.remove("smoothTransition"); //jump
    if(toScreen == Screens.MAINSCREEN){ //from top to bottom (= second to main screen) 
      this.dualscreen.focusMainWindow();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
      this.eyeInputService.moveArrowWithEyes(this.mainScreen_arrow!, window);
      this.mainScreen_arrow!.style.visibility = 'visible';
      this.eyeInputService.activateMix2Input(window, this.mainScreen_arrow, this.timeOutAfterMouseInput);
    }
    else{ //from bottom to top (= main to second screen)
      this.dualscreen.focusSecondWindow();
      this.eyeInputService.moveArrowWithEyes(this.dualscreen.secondScreen_arrow.nativeElement, this.dualscreen.secondWindow);
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "visible";
      this.mainScreen_arrow!.style.visibility = 'hidden';
      this.eyeInputService.activateMix2Input(this.dualscreen.secondWindow, this.dualscreen.secondScreen_arrow.nativeElement, this.timeOutAfterMouseInput);
    }
    this.taskEvaluationService.addScreenChange();
  }

  protected startEyeInput(){ //not needed for this experiment
  }

  protected startMix1Input(){ //not needed for this experiment
  }

  protected checkIfError(clickArea : HTMLElement | null){
      console.log("check if error click area", clickArea)
      if(clickArea){ //if not clicked outside of click area
        //Check if right area clicked
        if(clickArea?.id != this.taskElementID && clickArea.parentElement?.id != this.taskElementID){
          this.error = true;
          this.taskEvaluationService.addError();
        }
        else{ 
          this.addSuccess();
        }
      }
  }

  public async addSuccess() {
    this.taskEvaluationService.calculateTargetDistance(this.taskElement as HTMLElement, this.taskEvaluationService.targetOnMainScreen ? window : this.dualscreen.secondWindow);
    this.error = false;
    this.taskEvaluationService.endTask(false);
    this.showInterTrialPage(true);
    try {
        await this.randomizationService.nextRep();
    } catch (error) {
        console.error("An error occurred during nextRep():", error);
    }
    this.showInterTrialPage(false);
  }

  public async skipBlock() : Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const repAtSkip = this.randomizationService.repsDone;
        while (this.randomizationService.repsDone % 4 !== 0 || this.randomizationService.repsDone === repAtSkip) {
          this.error = false;
          this.taskEvaluationService.endTask(true);
          this.showInterTrialPage(true);
          await this.randomizationService.nextRep()
        } 
        this.showInterTrialPage(false)
        resolve();
      }
      catch (error) {
        console.error("An error occurred during skipBlock():", error);
        return reject(error)
      }  
    })
  }

  protected startMouseInput(){
    this.getclickAreas();
    for (let i = 0; i < this.clickAreas!.length; i++){
      let clickArea = this.clickAreas![i] as HTMLElement;
      clickArea.addEventListener('mousedown', this.bound_changeOnClick);
    }
  }

  private bound_changeOnClick = this.changeOnClick.bind(this);
  private async changeOnClick(ev: any) {
      try {
          await this.getclickAreas();
          const currentClickArea = this.determineClickedArea(ev);
          if (currentClickArea) {
              this.checkIfError(currentClickArea);
          }
      } catch (error) {
          console.error("An error occurred in changeOnClick:", error);
      }
  }

  private determineClickedArea(ev: any): HTMLElement | null {
      let currentClickArea: HTMLElement | null = null;
      let arrow = this.dualscreen.getActiveScreen() === 2 ? this.dualscreen.secondScreen_arrow.nativeElement : this.mainScreen_arrow;
      let style = window.getComputedStyle(arrow);
      let matrix = new WebKitCSSMatrix(style.transform);
      let x = matrix.m41;
      let y = matrix.m42;
      if (this.selectedInputType === InputType.MIX2) {
          const halflength = Math.ceil(this.clickAreas!.length / 2);
          const activeClickAreas = this.dualscreen.getActiveScreen() === 1 ? this.clickAreas!.slice(0, halflength) : this.clickAreas!.slice(halflength);

          for (let i = 0; i < activeClickAreas.length; i++) {
              const clickArea = activeClickAreas[i] as HTMLElement;
              if (this.eyeInputService.isInside(clickArea, x, y)) {
                  currentClickArea = clickArea;
                  break;
              }
          }
      }
      if (this.selectedInputType === InputType.MOUSE) {
          currentClickArea = ev.target;
      }
      return currentClickArea;
  }

  public showInterTrialPage(show : boolean){
    this.clicked = show
    this.setCurrentCursorVisibility(!show);
    if(!show){
      if(this.selectedInputType == InputType.MOUSE){ //to add eventListeners to new clickAreas 
        this.activateSelectedInputType();
      }
      this.error = false;
    }
  }

  protected startMix2Input(){
    this.webSocketService.startSendingGazeData();
    this.eyeInputService.activateMix2Input(window, this.mainScreen_arrow, this.timeOutAfterMouseInput); //Start with main screen
    this.mainScreen_arrow!.style.visibility = 'visible';
    //start waiting for screen changes and clicks
    this.startScreenChangeDetection();
    document.addEventListener('mousedown', this.bound_changeOnClick);
    this.mix2loaded = true;
  }

  public stopAllInputs(){
    //end screen change detection
    clearInterval(this.screenChangeDetection_interval);
    //remove click event MOUSE input
    if(this.clickAreas){
      for (let i = 0; i < this.clickAreas!.length; i++){
        let clickArea = this.clickAreas![i] as HTMLElement;
        clickArea.removeEventListener('mousedown', this.bound_changeOnClick)
      }
    }
    //MIX2
    this.mix2loaded = false;
    this.dualscreen.mainWindow.document.body.style.backgroundColor = "var(--apricot)";
    this.dualscreen.secondWindow.document.body.style.backgroundColor = "var(--apricot)";
    this.eyeInputService.stopMix2Input();
    document.removeEventListener('mousedown', this.bound_changeOnClick); 
    this.webSocketService.stopSendingGazeData();
  }

  private setCurrentCursorVisibility(visible : boolean){
    if(this.selectedInputType == InputType.MOUSE){
      let style = (!visible)?'none':'';
      document.body.style.cursor = style
      this.dualscreen.secondWindow.document.body.style.cursor = style;
    }
    else{
      let style = (!visible)?'hidden':'visible';
      if(this.currentScreen == Screens.MAINSCREEN){
        this.mainScreen_arrow!.style.visibility = style
      }
      else{
        this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = style
      }
    }
  }

}