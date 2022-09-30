import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from './state/app.state';
import { InputType } from './enums/input-type';
import { Tasks } from './enums/tasks';

import { changeInputType, changeTask } from './state/expConditions/expconditions.action';
import { selectTask } from './state/expConditions/expconditions.selector';
import { selectInputType } from './state/expConditions/expconditions.selector';
import { CalibrationComponent } from './calibration/calibration.component';
import { BaseTasksComponent } from './base-tasks/base-tasks.component';
import { WebgazerService } from 'src/app/services/webgazer.service';
import { TaskEvaluationService } from './services/task-evaluation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'eye-input-visualization';
  @ViewChild(BaseTasksComponent) baseTaskComponent! : BaseTasksComponent;
  @ViewChild(CalibrationComponent) calibrationCmp : CalibrationComponent = new CalibrationComponent();

  //enums for use in template
  public InputType = InputType;
  public TaskType = Tasks;

  //calibration status
  public calibrationDone : boolean = false;
  public showPopup = true; 

  //selections from dropdown
  public selectedTask : Tasks | null = null; 
  public selectedInputType : InputType | null = null; 
  // store
  public selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);

  public instructions : string = "Please select a task first, then the input method!";

  //order
  public inputOrder : InputType[] = [InputType.EYE, InputType.MIX1, InputType.MIX2, InputType.MOUSE];
  public taskOrder : Tasks[] = [Tasks.HOVER, Tasks.SCROLL, Tasks.SELECT]
  public inputsDone : number = 0;
  public tasksDone : number = 0;

  constructor(private store : Store<AppState>, public webgazerService : WebgazerService, public taskEvaluationService : TaskEvaluationService){}

  ngOnInit(): void {
    this.webgazerService.startWebgazer();
    this.webgazerService.checkWebGazerLoaded();
    this.randomize();
  }

  public showExplanation(){ //calibration
    this.calibrationCmp.showExplanation();
  }

  public setCalibrationDone(done : boolean){
    this.calibrationDone = done;
  }

  public nextInputMethod(){
    this.showExplanation(); //TODO: another explanation when calibration has already been done, that also includes input type
    this.setCalibrationDone(false);
    this.tasksDone = 0;
    if(this.inputsDone <= this.inputOrder.length){
      this.selectedInputType = this.inputOrder[this.inputsDone];
      this.selectInputType()
      this.inputsDone++;
    }
    else{
      console.error("Last Input Method already reached.")
    }
  }

  public nextTask(){
    if(this.tasksDone <= this.taskOrder.length){
      this.selectedTask = this.taskOrder[this.tasksDone];
      this.selectTask()
      this.tasksDone++;
    }
    else{
      this.showQuestionnaireInfo();
    }
  }

  public showQuestionnaireInfo(){
    //TODO
  }

  public selectTask(){
    if(this.selectedTask){
      this.store.dispatch(changeTask({newTask: this.selectedTask}));
    }
    this.baseTaskComponent.activateSelectedInputType();
    this.setInstruction(); //move into baseTaskComponent ?
  }

  public selectInputType(){
    if(this.selectedInputType){
      this.store.dispatch(changeInputType({newInputType: this.selectedInputType}));
    }
    this.baseTaskComponent.activateSelectedInputType();
    this.setInstruction();
  }

  public setInstruction(){
    var input = this.selectedInputType;
    var task = this.selectedTask;
    if(input == InputType.EYE){
      switch(task){
        case Tasks.HOVER:
          this.instructions = "Look at the button to make it switch color."
          break;
        case Tasks.SCROLL:
          this.instructions = "Look at the edges of the screen to scroll in the respective direction."
          break;
        case Tasks.SELECT:
            this.instructions = "Look at the button for some seconds to select it."
            break;
      }
    }
    if(input == InputType.MIX1){
      switch(task){
        case Tasks.HOVER:
          this.instructions = "Look at the button and confirm with ENTER."
          break;
        case Tasks.SCROLL:
          this.instructions = "Look at the edges of the screen and confirm with ENTER to scroll in the respective direction."
          break;
        case Tasks.SELECT:
            this.instructions = "Look at the button and confirm with ENTER."
            break;
      }
    }
    if(input == InputType.MIX2){
      switch(task){
        case Tasks.HOVER:
          this.instructions = "Use your eyes to move the cursor near the button. With the mouse, you can override eye movements and thus do the finetuning of the movement."
          break;
        case Tasks.SCROLL:
          this.instructions = "Use your eyes to move the cursor near the button. With the mouse, you can override eye movements and thus do the finetuning of the movement. Move the cursor to the screen borders to scroll in the respective direction."
          break;
        case Tasks.SELECT:
            this.instructions = "Use your eyes to move the cursor near the button. With the mouse, you can override eye movements and thus do the finetuning of the movement. Click to select the button."
            break;
      }
    }
    if(input == InputType.MOUSE){
      switch(task){
        case Tasks.HOVER:
          this.instructions = "Use the mouse to hover over the button."
          break;
        case Tasks.SCROLL:
          this.instructions = "Use the mouse to scroll the page."
          break;
        case Tasks.SELECT:
            this.instructions = "Use the mouse to click the button."
            break;
      }
    }
  }

  public randomize(){
    this.shuffle(this.inputOrder);
    this.shuffle(this.taskOrder);
  }

  //source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  private shuffle(array : any[]) {
  let currentIndex = array.length,  randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}


}  





