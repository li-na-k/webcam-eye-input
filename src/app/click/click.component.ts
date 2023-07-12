import { ChangeDetectorRef, Component, HostListener, ViewChild } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { WebgazerService } from '../services/webgazer.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
import { Sizes } from '../enums/sizes';
import { InputType } from '../enums/input-type';
@Component({
  selector: 'app-click',
  providers: [{ provide: BaseTasksComponent, useExisting: ClickComponent }],
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent extends BaseTasksComponent {
  @HostListener('body:mousemove', ['$event']) 
  onMouseMove(e : any) {
    if(this.dualscreen.getActiveScreen() == 2 && this.dualscreen.secondScreen_arrow && this.dualscreen.secondWindow){
      this.eyeInputService.moveArrowWithMouse(e, this.dualscreen.secondScreen_arrow.nativeElement, [0, this.dualscreen.secondWindow.width, this.dualscreen.secondWindow.height, 0]);
    }
    else if(this.arrow && this.dualscreen.mainWindow){
      this.eyeInputService.moveArrowWithMouse(e, this.arrow, [0, this.dualscreen.mainWindow.width, this.dualscreen.mainWindow.height, 0]);
    }
    this.eyeInputService.bound_measureMouseDist; //Track mouse / eye distribution 
  }

  @ViewChild('dualscreen') dualscreen! : any;

  private readonly dwellTime = 1000;
  private className : string = "clickArea"
  private clickAreas : Array<Element> | null = null; //all target areas 
  private intervals : any[] = [0,0,0,0]; //one for each click Area
  protected Sizes = Sizes;

  private taskElementID : string = "click-task"; //area that shows success when clicked
  protected  clicked : boolean = false;
  protected error : boolean = false;
  private screenChangeAreas : Array<Element> | null = null;
  private activeScreenChangeArea : any;
  private screenChangeDetection_interval : any = null;

  constructor(cdRef: ChangeDetectorRef, private eyeInputService : EyeInputService, store : Store<AppState>, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
   super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
  }

  async getclickAreas(){
    const clickAreas_mainScreen = document.getElementsByClassName(this.className)
    const clickAreas_secondScreen = this.dualscreen.secondWindow.document.getElementsByClassName(this.className);
    this.clickAreas = [].slice.call(clickAreas_mainScreen).concat([].slice.call(clickAreas_secondScreen)); 
  }

  async getScreenChangeAreas(){
    const screenChangeAreas_mainScreen = document.getElementsByClassName("screen-change-area")
    const screenChangeAreas_secondScreen = this.dualscreen.secondWindow.document.getElementsByClassName("screen-change-area");
    this.screenChangeAreas = [].slice.call(screenChangeAreas_mainScreen).concat([].slice.call(screenChangeAreas_secondScreen));
  }

  private async startScreenChangeDetection(){
    var timeOutAfterScreenChange = false;
    this.getScreenChangeAreas();
    await this.sandbox!.requestPointerLock();
    this.mix2loaded = true;
    this.activeScreenChangeArea = this.screenChangeAreas![0];
    this.screenChangeDetection_interval = setInterval(() => {
      if(!timeOutAfterScreenChange){
        let inside = this.eyeInputService.areEyesInsideElement(this.activeScreenChangeArea);
        if (inside){
          this.changeScreen(this.activeScreenChangeArea)
          timeOutAfterScreenChange = true;
          setTimeout(() => {
            timeOutAfterScreenChange = false;
          }, 1000);
        }
      }
    }, 300)
  }

  private changeScreen(screenChangeArea : HTMLElement){
    let arrow : any = null;
    if(screenChangeArea.classList.contains("bottom")){ //from top to bottom (= second to main screen)
      this.dualscreen.focusMainWindow();
      this.taskEvaluationService.addScreenChange();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
      this.arrow!.style.visibility = 'visible';
      this.activeScreenChangeArea = this.screenChangeAreas![0];
      arrow = this.arrow!;
    }
    else{ //from bottom to top (= main to second screen)
      this.dualscreen.focusSecondWindow();
      this.taskEvaluationService.addScreenChange();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "visible";
      this.arrow!.style.visibility = 'hidden';
      this.activeScreenChangeArea = this.screenChangeAreas![1];
      arrow = this.dualscreen.secondScreen_arrow.nativeElement;
    }
        this.eyeInputService.moveArrowWithEyes(arrow, true);
  }

  protected startEyeInput(){
      this.clickAreas = [].slice.call(document.getElementsByClassName(this.className)) //necessary because different HTML elements for different sizes
      for (let i = 0; i < this.clickAreas!.length; i++){
        let clickArea = this.clickAreas![i] as HTMLElement;
        let wentInsideAt : number|null = null; 
        let inside : boolean = false;
        this.intervals[i] = setInterval(() => {

          if(clickArea){
            inside = this.eyeInputService.areEyesInsideElement(clickArea);
            if (inside == true){
              if (!wentInsideAt) { //entered -> dwell time start
                wentInsideAt = Date.now()
                //visualize dwell time
                clickArea.style.border = "5px solid #00000050";
              }
              else if (wentInsideAt + this.dwellTime < Date.now()) { //click
                clickArea.style.border = "";
                this.checkIfError(clickArea);
              }
            }
            else{
              wentInsideAt = null;
              clickArea.style.border = "";
            }
          }
        }, 100);
      }
  }

  protected startMix1Input(){
    document.body.addEventListener('keydown', this.bound_Mix1Input); 
  }

  private bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
  private Mix1Input(e : any){
    if(e.keyCode == 13){
      for (let i = 0; i < this.clickAreas!.length; i++){
        let clickArea = this.clickAreas![i] as HTMLElement;
        let inside : boolean = false;   
        inside = this.eyeInputService.areEyesInsideElement(clickArea);
        if (inside == true){ 
          this.checkIfError(clickArea);
        }
      }
    }
  }

  protected checkIfError(clickArea : HTMLElement | null){
      console.log("check if error click area", clickArea)
      let success = false;
      if(clickArea){ //if not clicked outside of click area
        this.clicked = true;
        //Check if right area clicked
        if(clickArea?.id != this.taskElementID && clickArea.parentElement?.id != this.taskElementID){
          this.error = true;
          this.taskEvaluationService.addError();
        }
        else{ 
          this.addSuccess();
          success = true;
        }
        this.backToTasksPage(success) //timeout starts
      }
      else{
        this.clicked = false;
      }
  }

  public addSuccess(aborted?: boolean){
    this.error = false; 
    this.taskEvaluationService.endTask(aborted); 
    if(aborted){
      this.randomizationService.nextRep();
    }
  }

  protected startMouseInput(){
    this.getclickAreas();
    for (let i = 0; i < this.clickAreas!.length; i++){
      let clickArea = this.clickAreas![i] as HTMLElement;
      clickArea.addEventListener('mousedown', this.bound_changeOnClick);
    }
  }

  private bound_changeOnClick = this.changeOnClick.bind(this);
  private changeOnClick(ev : any){
    let currentClickArea : HTMLElement | null = null;
    let arrow = this.dualscreen.getActiveScreen()==2?this.dualscreen.secondScreen_arrow.nativeElement:this.arrow;
    let style = window.getComputedStyle(arrow);
    let matrix = new WebKitCSSMatrix(style.transform);
    let x = matrix.m41; 
    let y = matrix.m42;
    if(this.selectedInputType == InputType.MIX2){
      //only check click areas of active screen (first half of clickAreas array on main screen, second half on second screen
      var halflength = Math.ceil(this.clickAreas!.length / 2);    
      var activeClickAreas : Element[] = this.dualscreen.getActiveScreen() == 1?this.clickAreas!.slice(0,halflength):this.clickAreas!.slice(halflength, undefined)
      for (let i = 0; i < activeClickAreas!.length; i++){
        let clickArea = activeClickAreas[i] as HTMLElement;
        let inside = false;
        inside = this.eyeInputService.isInside(clickArea, x,y);  
        if(inside){
          currentClickArea = clickArea;
          break; //exit for loop as soon as clicked area found
        }
      }
      if(currentClickArea == null || this.pointerLockStopped){ 
        this.clicked = false;
      }
    }
    if(this.selectedInputType == InputType.MOUSE){
      currentClickArea = ev.target; 
    }
    this.checkIfError(currentClickArea);
  }

  protected startMix2Input(){
    this.getclickAreas();
    //Focus main window in the beginning, display arrow in the middle of the screen
    this.dualscreen.focusMainWindow();
    this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
    this.arrow!.style.visibility = 'visible';
    this.startScreenChangeDetection();
    document.addEventListener('mousedown', this.bound_changeOnClick);
  }

  public stopAllInputs(){
    //end screen change detection
    clearInterval(this.screenChangeDetection_interval);
    //end Eye Input
    for(let i of this.intervals){clearInterval(i)};
    //end Mix1 click event
    document.body.removeEventListener('keydown', this.bound_Mix1Input); 
    //remove click event MOUSE input
    if(this.clickAreas){
      for (let i = 0; i < this.clickAreas!.length; i++){
        let clickArea = this.clickAreas![i] as HTMLElement;
        clickArea.removeEventListener('mousedown', this.bound_changeOnClick)
      }
    }
    //MIX2
    this.mix2loaded = false;
    this.arrow!.style.visibility = 'hidden';
    this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
    document.exitPointerLock(); 
    this.screenChangeDetection_interval?.clearInterval;
    this.dualscreen.mainWindow.document.body.style.backgroundColor = "var(--apricot)";
    this.dualscreen.secondWindow.document.body.style.backgroundColor = "var(--apricot)";
    document.removeEventListener('mousedown', this.bound_changeOnClick); 
  }

  private backToTasksPage(success? : boolean){
    this.stopAllInputs();
    setTimeout(() =>  {
      this.clicked = false;
      this.error = false;
      if(success){
        this.randomizationService.nextRep(); 
      }
      this.activateSelectedInputType();
    }, 4000)          
  }

}
