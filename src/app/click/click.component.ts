import { ChangeDetectorRef, Component, HostListener, Pipe, PipeTransform, Renderer2, RendererFactory2, ViewChild } from '@angular/core';
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
    if(this.dualscreen.secondScreen_arrow && this.dualscreen.secondWindow){ // move second screen arrow with mouse
      this.eyeInputService.moveArrowWithMouse(e, this.dualscreen.secondScreen_arrow.nativeElement, [0, this.dualscreen.secondWindow.innerWidth, this.dualscreen.secondWindow.innerHeight, 0]);
    }
    if(this.mainScreen_arrow && this.dualscreen.mainWindow){ //move main screen arrow with mouse
      this.eyeInputService.moveArrowWithMouse(e, this.mainScreen_arrow, [0, this.dualscreen.mainWindow.innerWidth, this.dualscreen.mainWindow.innerHeight, 0]);
    }   
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

  private renderer: Renderer2;

  constructor(
    cdRef: ChangeDetectorRef, 
    rendererFactory : RendererFactory2,
    private eyeInputService : EyeInputService, 
    store : Store<AppState>, 
    taskEvaluationService : TaskEvaluationService, 
    randomizationService : RandomizationService,
    private webSocketService : SocketService) {
   super(store, cdRef, taskEvaluationService, randomizationService);
   this.renderer = rendererFactory.createRenderer(null, null);
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
  private startScreenChangeDetection(moveCursor : boolean = true, hideInactiveCursor : boolean = true) {
    console.log("screen detection started")
    this.currentScreen$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(d => {
        this.changeScreen(d, moveCursor, hideInactiveCursor)
        this.currentScreen = d;
      })
  }

  private changeScreen(toScreen : Screens, moveCursor : boolean = true, hideInactiveCursor : boolean = true){
    const eyeInputTimeOut = 0 //after screenchange, wait a few seconds before moving cursor with eye again (easier mouse take over after screen change!)
    this.mainScreen_arrow!.classList.remove("smoothTransition"); //jump
    this.dualscreen.secondScreen_arrow.nativeElement.classList.remove("smoothTransition"); //jump
    this.taskEvaluationService.addScreenChange();
    if(toScreen == Screens.MAINSCREEN){ //from top to bottom (= second to main screen) 
      this.dualscreen.focusMainWindow();
      if(moveCursor) this.eyeInputService.moveArrowWithEyes(this.mainScreen_arrow!, window); //move cursor to gaze position at new screen
      hideInactiveCursor?this.toggleCursorVisibility(toScreen):this.toggleCursorColor(toScreen);
      setTimeout(() => {
        this.eyeInputService.activateEyeInput(window, this.mainScreen_arrow, this.timeOutAfterMouseInput, moveCursor);
      }, eyeInputTimeOut)
    }
    else{ //from bottom to top (= main to second screen)
      this.dualscreen.focusSecondWindow();
      if(moveCursor) this.eyeInputService.moveArrowWithEyes(this.dualscreen.secondScreen_arrow.nativeElement, this.dualscreen.secondWindow);
      hideInactiveCursor?this.toggleCursorVisibility(toScreen):this.toggleCursorColor(toScreen);
      setTimeout(() => {
        this.eyeInputService.activateEyeInput(this.dualscreen.secondWindow, this.dualscreen.secondScreen_arrow.nativeElement, this.timeOutAfterMouseInput, moveCursor);
      }, eyeInputTimeOut)
      }
  }

  private toggleCursorVisibility(activeScreen : Screens){
    if(activeScreen == Screens.MAINSCREEN){ // hide second screen cursor
      this.renderer.setStyle(this.dualscreen.secondScreen_arrow.nativeElement, 'visibility', 'hidden');
      this.renderer.setStyle(this.mainScreen_arrow, 'visibility', 'visible');

    }
    else{ // hide main screen cursor
      this.renderer.setStyle(this.dualscreen.secondScreen_arrow.nativeElement, 'visibility', 'visible');
      this.renderer.setStyle(this.mainScreen_arrow, 'visibility', 'hidden');
    }
  }

  private toggleCursorColor(activeScreen : Screens){
    if(activeScreen == Screens.MAINSCREEN){ // hide second screen cursor
      this.renderer.setStyle(this.dualscreen.secondScreen_arrow.nativeElement, 'opacity', '0.5');
      this.renderer.setStyle(this.mainScreen_arrow, 'opacity', '1');
    }
    else{ // hide main screen cursor
      this.renderer.setStyle(this.dualscreen.secondScreen_arrow.nativeElement, 'opacity', '1');
      this.renderer.setStyle(this.mainScreen_arrow, 'opacity', '0.5');
    }
  }

  protected startEyeInput(){ //not needed for this experiment
  }

  protected startMix1Input(){ //Ninja Cursors - eyes only for changing screen/cursor
    this.webSocketService.startSendingGazeData();
    this.eyeInputService.activateEyeInput(window, this.mainScreen_arrow, this.timeOutAfterMouseInput, false); //Start with main screen
    this.renderer.setStyle(this.mainScreen_arrow, 'visibility', 'visible');
    this.renderer.setStyle(this.dualscreen.secondScreen_arrow.nativeElement, 'visibility', 'visible');
    //start waiting for screen changes and clicks
    this.startScreenChangeDetection(false, false);
    document.addEventListener('mousedown', this.bound_changeOnClick);
    this.mix2loaded = true;
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
        while (this.randomizationService.repsDone > 0 && this.randomizationService.repsDone % 4 !== 0 || this.randomizationService.repsDone === repAtSkip) {
          this.error = false;
          this.taskEvaluationService.endTask(true);
          this.showInterTrialPage(true);
          await this.randomizationService.nextRep() //if nextTask is called: repsDone set to -1 -> check for larger 0 in while loop
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
      if (this.selectedInputType === InputType.MIX2 || this.selectedInputType === InputType.MIX1) {
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
    const skipButton = document.getElementById("skip");
    this.clicked = show
    this.setCurrentCursorVisibility(!show);
    if(!show){
      if(this.selectedInputType == InputType.MOUSE){ //to add eventListeners to new clickAreas 
        this.activateSelectedInputType();
      }
      if(skipButton && skipButton instanceof HTMLButtonElement){
        (skipButton as HTMLButtonElement).disabled = false
      }
      this.error = false;
    }
    else{
      if(skipButton && skipButton instanceof HTMLButtonElement){
        (skipButton as HTMLButtonElement).disabled = true
      }
    }
  }

  protected startMix2Input(){
    this.webSocketService.startSendingGazeData();
    this.eyeInputService.activateEyeInput(window, this.mainScreen_arrow, this.timeOutAfterMouseInput); //Start with main screen
    this.renderer.setStyle(this.mainScreen_arrow, 'visibility', 'visible');
    //start waiting for screen changes and clicks
    this.startScreenChangeDetection(true, true);
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
      this.renderer.setStyle(document.body, 'cursor', style);
      this.renderer.setStyle(this.dualscreen.secondWindow.document.body, 'cursor', style);
    }
    else{
      let style = (!visible)?'hidden':'visible';
      if(this.currentScreen == Screens.MAINSCREEN){
        this.renderer.setStyle(this.mainScreen_arrow, 'visibility', style);
      }
      else{
        this.renderer.setStyle(this.dualscreen.secondScreen_arrow.nativeElement, 'visibility', style);
      }
    }
  }

}