import { BoundElementProperty } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { InputType } from '../enums/input-type';
import { Sizes } from '../enums/sizes';
import { Tasks } from '../enums/tasks';
import { AppState } from '../state/app.state';
import { changeInputType, changeTask } from '../state/expConditions/expconditions.action';
import { selectTask, selectInputType } from '../state/expConditions/expconditions.selector';
import { TaskEvaluationService } from './task-evaluation.service';

@Injectable({
  providedIn: 'root'
})
export class RandomizationService {

  public taskInstructions : string = "Please select a task first, then the input method!";
  public inputMethodInstructions : string = "";
  //selections from dropdown
  public selectedTask : Tasks | null = null; 
  public selectedInputType : InputType | null = null; 
  // store
  public selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);

  //order of tasks
  public inputOrder : InputType[] = [InputType.EYE, InputType.MIX1, InputType.MIX2, InputType.MOUSE]; //string instead??
  public taskOrder : Tasks[] = [Tasks.HOVER, Tasks.SCROLL, Tasks.SELECT];
  public positionOrder : string[] = ["pos1", "pos2", "pos3", "pos4"];
  public inputsDone : number = 0; 
  public tasksDone : number = 0;

  // each task: 3 different sizes, two reps each
  public sizeOrder = [Sizes.S, Sizes.S , Sizes.M, Sizes.M, Sizes.L, Sizes.L];
  public repsDone : number = 0;
  public selectedSize : Sizes =  Sizes.M;
  //public selectedPos : string = "";

  //final page after finishing inputs 
  public everythingDone: boolean = false;
  public showQuestionnaireInfo : boolean = false;


  messageSubject = new Subject();
  

  constructor(private store : Store<AppState>, private taskEvalutationService : TaskEvaluationService) { 
    this.randomize();
    console.log(this.inputOrder);
    console.log(this.taskOrder);
    console.log(this.sizeOrder);
    console.log(this.positionOrder);
  }

  //source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  public shuffle(array : any[]) {
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


  public nextInputMethod(){ 
    this.tasksDone = 0;
    if(this.inputsDone < this.inputOrder.length){
      this.selectedInputType = this.inputOrder[this.inputsDone];
      this.selectInputType()
      this.inputsDone++;
      this.nextTask(); //first task
    }
    else{
      this.everythingDone = true;
      this.taskEvalutationService.exportResults();
    }
  }

  private nextTask(){
    this.repsDone = 0;
    if(this.tasksDone < this.taskOrder.length){
      this.selectedTask = this.taskOrder[this.tasksDone];
      this.selectTask()
      this.tasksDone++;
      this.messageSubject.next('nextTask'); // emit event: popup with explanation + confirm button that activates input method should be displayed in app.component
    }
    else{
      this.showQuestionnaireInfo = true;
      this.nextInputMethod();
    }
  }

  public nextRep(){
    //endTask(); must be called separatly!
    if(this.repsDone + 1 < this.sizeOrder.length){
      this.selectedSize = this.sizeOrder[this.repsDone+1];
      this.taskEvalutationService.selectedSize = this.selectedSize;
      // if(this.repsDone >= this.positionOrder.length){ //TODO ??
      //   this.selectedPos = this.positionOrder[this.repsDone-this.positionOrder.length];
      // }
      // else{
      //   this.selectedPos = this.positionOrder[this.repsDone];
      // }
      this.shuffle(this.positionOrder); 
      this.repsDone++;
      this.taskEvalutationService.startTask();
    }
    else{
      this.nextTask();
    }
  }



  public selectTask(){
    if(this.selectedTask){
      this.store.dispatch(changeTask({newTask: this.selectedTask}));
    }
    this.setInstruction(); 
  }

  public selectInputType(){
    if(this.selectedInputType){
      this.store.dispatch(changeInputType({newInputType: this.selectedInputType}));
    }
    this.setInstruction();
  }

  public setInstruction(){
    let input = this.selectedInputType;
    let task = this.selectedTask;
    if(input == InputType.EYE){
      this.inputMethodInstructions = "Move the red dot with your eye-gaze."
      switch(task){
        case Tasks.HOVER:
          this.taskInstructions = "Move the red dot over the button that says 'Hover over me!'."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Move the red dot to the screen borders to scroll in the respective direction. Scroll to the headline that says „Scroll here!“, then scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Move the red dot over the button that says 'Select me!' for some seconds to select it."
            break;
      }
    }
    if(input == InputType.MIX1){
      this.inputMethodInstructions = "Move the red dot with your eye-gaze. To confirm the position press ENTER."
      switch(task){
        case Tasks.HOVER:
          this.taskInstructions = "Move the red dot over the button that says 'Hover over me!' and confirm with ENTER."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Move the red dot to the screen borders and press ENTER to scroll in the respective direction. Scroll to the headline that says „Scroll here“, then scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Move the red dot over the button that says 'Select me!' and confirm with ENTER."
            break;
      }
    }
    if(input == InputType.MIX2){
      this.inputMethodInstructions = "Move the red dot with your eye-gaze. With the mouse you can override eye input and thus do the finetuning of the cursor movement."
      switch(task){
        case Tasks.HOVER:
          this.taskInstructions = "Move the cursor over the button that says 'Hover over me!'."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Move the cursor to the screen borders to scroll in the respective direction. Scroll to the headline that says „Scroll here“, then scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Move the cursor over the button that says 'Select me!'. Click (with your mouse) to select the button."
            break;
      }
    }
    if(input == InputType.MOUSE){
      this.inputMethodInstructions = "Use the mouse, like you normally would."
      switch(task){
        case Tasks.HOVER:
          this.taskInstructions = "Hover over the button that says 'Hover over me!'."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Scroll to the headline that says „Scroll here“. Then, scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Click the button that says 'Select me!'."
            break;
      }
    }
  }

  private randomize(){
    this.shuffle(this.inputOrder);
    this.shuffle(this.taskOrder);
    this.shuffle(this.sizeOrder); 
    this.shuffle(this.positionOrder);
    this.selectedSize = this.sizeOrder[0]; //first size
  }

}
