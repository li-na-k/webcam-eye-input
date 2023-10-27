import { AfterViewInit, ChangeDetectorRef, Component, HostListener, ViewChild } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
import { Sizes } from '../enums/sizes';
import { InputType } from '../enums/input-type';
import { Screens } from '../enums/screens';
import { Observable, takeUntil } from 'rxjs';
import { selectCurrentScreen } from '../state/eyetracking/eyetracking.selector';
@Component({
  selector: 'app-click',
  providers: [{ provide: BaseTasksComponent, useExisting: ClickComponent }],
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent extends BaseTasksComponent implements AfterViewInit{
  @HostListener('body:mousemove', ['$event']) 
  onMouseMove(e : any) {
    if(this.dualscreen.getActiveScreen() == 2 && this.dualscreen.secondScreen_arrow && this.dualscreen.secondWindow){
      this.eyeInputService.moveArrowWithMouse(e, this.dualscreen.secondScreen_arrow.nativeElement, [0, this.dualscreen.secondWindow.width, this.dualscreen.secondWindow.height, 0]);
    }
    else if(this.arrow && this.dualscreen.mainWindow){
      this.eyeInputService.moveArrowWithMouse(e, this.arrow, [0, this.dualscreen.mainWindow.width, this.dualscreen.mainWindow.height, 0]);
    }
    this.eyeInputService.bound_analyseMix2; //Track mouse / eye distribution 
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

  private screenChangeDetection_interval : any = null;

  constructor(cdRef: ChangeDetectorRef, private eyeInputService : EyeInputService, store : Store<AppState>, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
   super(store, cdRef, taskEvaluationService, randomizationService)
  }

  ngAfterViewInit(){
    this.getclickAreas();
  }
  async getclickAreas(){
    const clickAreas_mainScreen = document.getElementsByClassName(this.className)
    const clickAreas_secondScreen = this.dualscreen.secondWindow.document.getElementsByClassName(this.className);
    this.clickAreas = [].slice.call(clickAreas_mainScreen).concat([].slice.call(clickAreas_secondScreen)); 
  }

  private currentScreen$ : Observable<any> = this.store.select(selectCurrentScreen);
  private startScreenChangeDetection() {
    console.log("screen detection started")
    this.currentScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => {
        console.log("new Screen", d)
        this.changeScreen(d)
      })
  }


  private changeScreen(toScreen : Screens){
    let arrow : any = null;
    if(toScreen == Screens.MAINSCREEN){ //from top to bottom (= second to main screen)
      this.dualscreen.focusMainWindow();
      this.taskEvaluationService.addScreenChange();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
      this.arrow!.style.visibility = 'visible';
      arrow = this.arrow!;
      this.eyeInputService.activateMix2Input(window.document.body, this.arrow, this.timeOutAfterMouseInput);
    }
    else{ //from bottom to top (= main to second screen)
      this.dualscreen.focusSecondWindow();
      this.taskEvaluationService.addScreenChange();
      this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "visible";
      this.arrow!.style.visibility = 'hidden';
      arrow = this.dualscreen.secondScreen_arrow.nativeElement;
      this.eyeInputService.activateMix2Input(this.dualscreen.secondWindow.document.body, this.dualscreen.secondScreen_arrow.nativeElement, this.timeOutAfterMouseInput);
    }
    this.eyeInputService.moveArrowWithEyes(arrow, true);
  }

  protected startEyeInput(){ //not needed for this experiment
  }

  protected startMix1Input(){ //not needed for this experiment
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
    this.eyeInputService.activateMix2Input(window.document.body, this.arrow, this.timeOutAfterMouseInput); //Start with main screen
    this.arrow!.style.visibility = 'visible';
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
    this.arrow!.style.visibility = 'hidden';
    this.dualscreen.secondScreen_arrow.nativeElement.style.visibility = "hidden";
    document.exitPointerLock(); 
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
