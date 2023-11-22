import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { InputType } from '../enums/input-type';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
import { Tasks } from '../enums/tasks';

@Component({
  selector: 'app-test-input-methods',
  templateUrl: './test-input-methods.component.html',
  styleUrls: ['./test-input-methods.component.css']
})
export class TestInputMethodsComponent extends BaseTasksComponent implements OnInit, OnDestroy, AfterViewInit {
  
    public override secondWindowLoaded: boolean = false;
    private clickArea : HTMLElement | null = null; //all areas
    protected Input = InputType;
  
    private taskElementID : string = "click-task"; //area that shows success when clicked
    protected success = false;

    private originalFirstInputMethod : InputType = InputType.EYE;
    private originalFirstTask : Tasks = Tasks.SELECT;

    @Output() endTestEvent = new EventEmitter<void>();
  
    constructor(cdRef: ChangeDetectorRef, private eyeInputService : EyeInputService, store : Store<AppState>, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
     super(store, cdRef, taskEvaluationService, randomizationService)
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
      this.mainScreen_arrow = document.getElementById("arrow");
      //mouse as first input method
      this.selectInputType(InputType.MOUSE);
    }

    public addSuccess(){
      this.taskEvaluationService.playAudio();
      this.clickArea?.classList.add("success");
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
          let inside = this.eyeInputService.isInside(this.clickArea!, parseInt(this.mainScreen_arrow!.style.left, 10), parseInt(this.mainScreen_arrow!.style.top, 10));
          if(inside){
            this.addSuccess();
          }
      }
      if(this.selectedInputType == InputType.MOUSE){
        this.addSuccess();
      }
    }
  
    protected async startMix2Input(){
      await this.eyeInputService.activateMix2Input(window, this.mainScreen_arrow, this.timeOutAfterMouseInput);
      document.addEventListener('mousedown', this.bound_changeOnClick);
      /* addEventListener is acutally not a very angular way of handling this... a Host Listener would
      have been better, but it cannot be removed, which is necessary here (for other input methods)
      -> using Renderer2 might have been an option but this works, so keeeping it like this for the moment */
      this.mix2loaded = true;
    }
  
    public stopAllInputs(){
      //remove click event MOUSE input
      if(this.clickArea){
       this.clickArea.removeEventListener('mousedown', this.bound_changeOnClick)
      }
      //MIX2
      this.mix2loaded = false;
      if(this.mainScreen_arrow){
        this.eyeInputService.stopMix2Input();
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

    protected override startMix1Input(): void {
      //not needed
    }

    protected startEyeInput(){ 
      //not needed
    }
  }
  
