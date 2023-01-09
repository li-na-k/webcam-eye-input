import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { InputType } from '../enums/input-type';
import { WebgazerService } from '../services/webgazer.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
import { Tasks } from '../enums/tasks';
import { baseColors } from 'ng2-charts';

@Component({
  selector: 'app-test-input-methods',
  templateUrl: './test-input-methods.component.html',
  styleUrls: ['./test-input-methods.component.css']
})
export class TestInputMethodsComponent extends BaseTasksComponent implements OnInit, OnDestroy, AfterViewInit {
  
    private readonly dwellTime = 1000;
    private clickArea : HTMLElement | null = null; //all areas
    private interval : any = 0; //one for each click Area
    protected Input = InputType;
  
    private taskElementID : string = "click-task"; //area that shows success when clicked
    protected success = false;

    private originalFirstInputMethod : InputType = InputType.EYE;
    private originalFirstTask : Tasks = Tasks.HOVER;

    @Output() endTestEvent = new EventEmitter<void>();
  
    constructor(cdRef: ChangeDetectorRef, private eyeInputService : EyeInputService, store : Store<AppState>, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
     super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
    }

    override ngOnInit(): void {
      super.ngOnInit();
      this.originalFirstInputMethod = this.selectedInputType; //remember before setting others for testing
      this.originalFirstTask = this.selectedTask;
      //now set new task "test"
      this.randomizationService.selectTask(Tasks.TEST);
    }

    ngAfterViewInit(){
      this.clickArea = document.getElementById(this.taskElementID)
      this.sandbox = document.getElementById("experimentSandbox");
      this.arrow = document.getElementById("arrow");
      //mouse as first input method
      this.selectInputType(InputType.MOUSE);
    }
    
    protected startEyeInput(){
          let wentInsideAt : number|null = null; 
          let inside : boolean = false;
          this.interval = setInterval(() => {
  
            if(this.clickArea){
              inside = this.eyeInputService.areEyesInsideElement(this.clickArea);
              if (inside == true){
                if (!wentInsideAt) { //entered -> dwell time start
                  wentInsideAt = Date.now()
                  //visualize dwell time
                  this.clickArea.style.border = "5px solid black";
                }
                else if (wentInsideAt + this.dwellTime < Date.now()) { //click
                  this.clickArea.style.border = "";
                  clearInterval(this.interval);
                  this.addSuccess();
                }
              }
              else{
                wentInsideAt = null;
                this.clickArea.style.border = "";
              }
            }
          }, 100);
    }
  
    protected startMix1Input(){
      document.body.addEventListener('keydown', this.bound_Mix1Input); 
    }
  
    private bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
    private Mix1Input(e : any){
      if(e.keyCode == 13){
          let inside : boolean = false;   
          inside = this.eyeInputService.areEyesInsideElement(this.clickArea!);
          if (inside == true){ 
            this.addSuccess();
          }
      }
    }
  

    public addSuccess(){
      this.taskEvaluationService.playAudio();
        this.clickArea?.classList.add("success")
        this.success = true;
      setTimeout(() => {
        this.clickArea?.classList.remove("success");
        this.success = false;
      },2000);
    }
  
  
    protected startMouseInput(){
      this.clickArea!.addEventListener('mousedown', this.bound_changeOnClick);
    }
  
    private bound_changeOnClick = this.changeOnClick.bind(this);
    private changeOnClick(){
      if(this.selectedInputType == InputType.MIX2){
          let inside = this.eyeInputService.isInside(this.clickArea!, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
          if(inside){
            this.addSuccess();
          }
      }
      if(this.selectedInputType == InputType.MOUSE){
        this.addSuccess();
      }
    }
  
  
    protected startMix2Input(){
      this.eyeInputService.activateMix2Input(this.sandbox, this.arrow, this.timeOutAfterMouseInput);
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
      clearInterval(this.interval);
      //end Mix1 click event
      document.body.removeEventListener('keydown', this.bound_Mix1Input); 
      //remove click event MOUSE input
      if(this.clickArea){
       this.clickArea.removeEventListener('mousedown', this.bound_changeOnClick)
      }
      //MIX2
      this.mix2loaded = false;
      if(this.arrow){
        this.eyeInputService.stopMix2Input(this.sandbox, this.arrow);
      }
      document.removeEventListener('mousedown', this.bound_changeOnClick); 
      //view port resets
    }


    protected selectInputType(inputMethod : InputType){
      var allChips = document.getElementsByClassName("chip");
      for (let i = 0; i < allChips.length; i++){
        let chip = allChips![i] as HTMLElement;
        chip.classList.remove("active-button")
      }
      let id = inputMethod.toString() + "-chip";
      let activeChip = document.getElementById(id);
      activeChip?.classList.add("active-button");
      this.randomizationService.selectInputType(inputMethod); 
      this.activateSelectedInputType(); 
    }

    blur($event : any){
      $event.target.blur();
    }

    protected endTestMode(){
      this.stopAllInputs();
      this.clickArea?.classList.remove("success");
      this.endTestEvent.emit();

      this.randomizationService.selectTask(this.originalFirstTask);
      this.randomizationService.selectInputType(this.originalFirstInputMethod); 
      this.activateSelectedInputType(); 
    }
  
  }
  
