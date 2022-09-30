import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { InputType } from '../enums/input-type';
import { WebgazerService } from '../services/webgazer.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';
@Component({
  selector: 'app-click',
  providers: [{ provide: BaseTasksComponent, useExisting: ClickComponent }],
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent extends BaseTasksComponent implements OnInit, OnDestroy  {

  public readonly dwellTime = 1000;
  public className : string = "clickArea"
  public clickAreas : HTMLCollectionOf<Element> | null = null; //all areas
  public intervals : any[] = [0,0,0,0]; //one for each click Area

  public taskElementID : string = "click-task"; //area that shows success when clicked
  public clicked : boolean = false;
  public error : boolean = false;

  constructor(cdRef: ChangeDetectorRef, private eyeInputService : EyeInputService, store : Store<AppState>, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService) {
   super(store, cdRef, webgazerService, taskEvaluationService)
  }

  override ngAfterViewInit(): void {
    this.clickAreas = document.getElementsByClassName(this.className)
  }

  public startEyeInput(){
      for (var i = 0; i < this.clickAreas!.length; i++){
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
                this.clicked = true;
                if(clickArea.id != this.taskElementID){
                  this.error = true;
                  this.taskEvaluationService.addError();
                }
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

  public startMix1Input(){
    document.body.addEventListener('keydown', this.bound_Mix1Input); 
  }

  public bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
  public Mix1Input(e : any){
    if(e.keyCode == 13){
      for (var i = 0; i < this.clickAreas!.length; i++){
        var clickArea = this.clickAreas![i] as HTMLElement;
        var inside : boolean = false;
        if(clickArea){    
          inside = this.eyeInputService.areEyesInsideElement(clickArea);
          if (inside == true){ 
            this.clicked = true;
            if(clickArea.id != this.taskElementID){
              this.error = true;
              this.taskEvaluationService.addError();
            }
          }
        }
      }
    }
  }

  public startMouseInput(){
    for (var i = 0; i < this.clickAreas!.length; i++){
      var clickArea = this.clickAreas![i] as HTMLElement;
      clickArea.addEventListener('click', this.bound_changeOnClick)
    }
  }

  public bound_changeOnClick = this.changeOnClick.bind(this);
  public changeOnClick(ev : any){
    var currentClickArea : HTMLElement | null = null; //reset from last click
    if(this.selectedInputType == InputType.MIX2){
      for (var i = 0; i < this.clickAreas!.length; i++){
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
    //check if any area was clicked
    console.log(currentClickArea);
    if(currentClickArea != null){ //if not clicked outside of click area
      this.clicked = true;
      //Check if right area clicked
      if(currentClickArea?.id != this.taskElementID && currentClickArea.parentElement?.id != this.taskElementID){
        this.error = true;
        this.taskEvaluationService.addError();
      }
      else{
        this.error = false;
      }
    }
    else{
      this.clicked = false;
    }
  }

  public startMix2Input(){
    this.eyeInputService.activateMix2Input(this.sandbox, this.arrow, this.timeOutAfterMouseInput);
    document.addEventListener('click', this.bound_changeOnClick); 
  }

  public stopAllInputs(){
    //TODO: more necessary back sets needed?
    //end Eye Input
    for(let i of this.intervals){clearInterval(i)};
    //end Mix1 click event
    document.body.removeEventListener('keydown', this.bound_Mix1Input); 
    //remove click event MOUSE input
    for (var i = 0; i < this.clickAreas!.length; i++){
      var clickArea = this.clickAreas![i] as HTMLElement;
      clickArea.removeEventListener('click', this.bound_changeOnClick)
    }
    //MIX2
    this.eyeInputService.stopMix2Input(this.sandbox, this.arrow);
    document.removeEventListener('click', this.bound_changeOnClick); 
    //view port resets
    this.clicked = false;
    this.error = false;
  }

}
