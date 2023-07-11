import { ChangeDetectorRef, Component, HostListener, ViewChild } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { WebgazerService } from '../services/webgazer.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
import { Sizes } from '../enums/sizes';
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

  private getScreenOfElement(el : any): number{
    if(el.classList.contains("secondScreen")){
      return 2;
    }
    else{
      return 1;
    }
  }

  private async startScreenChangeDetection(){
    var timeOutAfterScreenChange = false;
    this.getScreenChangeAreas();
    await this.sandbox!.requestPointerLock();
    this.mix2loaded = true;
    this.screenChangeDetection_interval = setInterval(() => {
      if(!timeOutAfterScreenChange){
        for(let i = 0; i < this.screenChangeAreas!.length; i++){
          let inside : boolean = false;
          let el : HTMLElement = this.screenChangeAreas![i] as HTMLElement;
          if(this.getScreenOfElement(el) != this.dualscreen.getActiveScreen()){ //check if right screen
            inside = false;
          }
          else{
            inside = this.eyeInputService.areEyesInsideElement(el!);
          }
          if (inside){
            this.changeScreen(el)
            timeOutAfterScreenChange = true;
            setTimeout(() => {
              timeOutAfterScreenChange = false;
            }, 2000);
          }
        }
      }
    }, 300)
  }

  private changeScreen(screenChangeArea : HTMLElement){
    if(screenChangeArea.classList.contains("bottom")){ //from top to bottom (= second to main screen)
      this.dualscreen.focusMainWindow();
      this.taskEvaluationService.addScreenChange();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
      this.arrow!.style.visibility = 'visible';
    }
    else{ //from bottom to top (= main to second screen)
      this.dualscreen.focusSecondWindow();
      this.taskEvaluationService.addScreenChange();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "visible";
      this.arrow!.style.visibility = 'hidden';
    }
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
    currentClickArea = ev.target; 
    this.checkIfError(currentClickArea);
  }

  protected startMix2Input(){
    this.getclickAreas();

    //Focus main window in the beginning, display arrow in the middle of the screen
    this.dualscreen.focusMainWindow();
    this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
    this.arrow!.style.visibility = 'visible';
    this.startScreenChangeDetection();
    for (let i = 0; i < this.clickAreas!.length; i++){
      let clickArea = this.clickAreas![i] as HTMLElement;
      clickArea.addEventListener('mousedown', this.bound_changeOnClick);
    }
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
    this.eyeInputService.stopMix2Input(this.sandbox!, this.arrow!);
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
