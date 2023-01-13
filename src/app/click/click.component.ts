import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { InputType } from '../enums/input-type';
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
export class ClickComponent extends BaseTasksComponent implements OnInit, OnDestroy  {

  private readonly dwellTime = 1000;
  private className : string = "clickArea"
  private clickAreas : HTMLCollectionOf<Element> | null = null; //all areas
  private intervals : any[] = [0,0,0,0]; //one for each click Area
  protected Sizes = Sizes;

  private taskElementID : string = "click-task"; //area that shows success when clicked
  protected  clicked : boolean = false;
  protected error : boolean = false;

  constructor(cdRef: ChangeDetectorRef, private eyeInputService : EyeInputService, store : Store<AppState>, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
   super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
  }

  ngAfterViewInit(): void {
    this.clickAreas = document.getElementsByClassName(this.className)
  }

  protected startEyeInput(){
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
                clickArea.style.border = "5px solid black";
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
      if(clickArea){ //if not clicked outside of click area
        this.clicked = true;
        //Check if right area clicked
        if(clickArea?.id != this.taskElementID && clickArea.parentElement?.id != this.taskElementID){
          this.error = true;
          this.taskEvaluationService.addError();
        }
        else{ 
          this.addSuccess();
        }
        this.backToTasksPage() //timeout starts
      }
      else{
        this.clicked = false;
      }
  }

  public addSuccess(aborted?: boolean){
    this.error = false; 
    this.taskEvaluationService.endTask(aborted);
    if(aborted){
      this.stopAllInputs(); 
      this.activateSelectedInputType();
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
    let currentClickArea : HTMLElement | null = null; //reset from last click
    if(this.selectedInputType == InputType.MIX2){
      for (let i = 0; i < this.clickAreas!.length; i++){
        let clickArea = this.clickAreas![i] as HTMLElement;
        let inside = this.eyeInputService.isInside(clickArea, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
        if(inside){
          currentClickArea = clickArea;
          break; //exit for loop as soon as clicked area found
        }
      }
      if(currentClickArea == null){ 
        this.clicked = false;
      }
    }
    if(this.selectedInputType == InputType.MOUSE){
      currentClickArea = ev.target; 
    }
    this.checkIfError(currentClickArea);
  }


  protected startMix2Input(){
    this.eyeInputService.activateMix2Input(window.document.body, this.arrow, this.timeOutAfterMouseInput);
    document.addEventListener('mousedown', this.bound_changeOnClick);
    /* addEventListener is acutally not a very angular way of handling this... a Host Listener would
    have been better, but it cannot be removed, which is necessary here (for other input methods)
    -> using Renderer2 might have been an option but this works, so keeeping it like this for the moment */
    setTimeout(() =>
      {this.mix2loaded = true;}
    ,500) //no other option because pointer lock request does not return observable to check success 
  }

  public stopAllInputs(){
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
    this.eyeInputService.stopMix2Input(this.sandbox, this.arrow);
    document.removeEventListener('mousedown', this.bound_changeOnClick); 
    //view port resets
    this.clicked = false;
    this.error = false;
  }

  private backToTasksPage(){
    setTimeout(() =>  {
      this.stopAllInputs(); 
      this.activateSelectedInputType();
      this.randomizationService.nextRep();
    }, 4000)  
  }

}
