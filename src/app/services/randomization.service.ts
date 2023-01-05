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

  private input : InputType = InputType.EYE;
  private task : Tasks = Tasks.HOVER;
  public taskInstructions : string = "";
  public inputMethodInstructions : string = "";

  // store
  private selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  private selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);

  //order of tasks
  public inputOrder : InputType[] = [InputType.EYE, InputType.MIX1, InputType.MIX2, InputType.MOUSE]; 
  public taskOrder : Tasks[] = [Tasks.SCROLL, Tasks.SELECT]; //to include the hover tasks, add "Tasks.HOVER" here
  public positionOrder : string[] = ["pos1", "pos2", "pos3", "pos4"];
  public inputsDone : number = 0; 
  public tasksDone : number = 0;

  // each task: 3 different sizes, two reps each
  public sizeOrder = [Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L];
  public repsDone : number = 0;
  public selectedSize : Sizes =  Sizes.S;
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

    this.selectedInputType$ //unsubscribing not necessary since angular services are singleton -> no memory leak possible
      .subscribe(d => {
        this.input = d
      });
    this.selectedTask$
      .subscribe(d => {
        this.task = d
      }); 
  }

  //source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  private shuffle(array : any[]) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }


  public nextInputMethod(){ 
    this.tasksDone = 0;
    if(this.inputsDone < this.inputOrder.length){
      this.selectInputType(this.inputOrder[this.inputsDone])
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
      this.selectTask(this.taskOrder[this.tasksDone])
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
      this.shuffle(this.positionOrder); 
      this.repsDone++;
      this.taskEvalutationService.startTask();
    }
    else{
      this.shuffle(this.sizeOrder); 
      this.nextTask();
    }
  }



  public selectTask(task : Tasks){
    this.store.dispatch(changeTask({newTask: task}));
    this.setInstruction(); 
  }

  public selectInputType(inputType : InputType){
    this.store.dispatch(changeInputType({newInputType: inputType}));
    this.setInstruction();
  }

  public setInstruction(){
    if(this.input == InputType.EYE){
      this.inputMethodInstructions = "Move the red dot with your eye-gaze."
      switch(this.task){
        case Tasks.HOVER:
          this.taskInstructions = "Move the red dot over the button that says 'Hover over me!'."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Move the red dot to the screen borders (framed area) to scroll in the respective direction. Scroll to the headline that says „Scroll here!“, then scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Move the red dot over the green area of the button that says 'Select me!' for some seconds to select it."
            break;
        case Tasks.TEST:
            this.taskInstructions = "You can move the red dot with your eye-gaze. To select the button, move the dot over it for some seconds."
            break;
      }
    }
    if(this.input == InputType.MIX1){
      this.inputMethodInstructions = "Move the red dot with your eye-gaze. To confirm the position press ENTER."
      switch(this.task){
        case Tasks.HOVER:
          this.taskInstructions = "Move the red dot over the button that says 'Hover over me!' and confirm with ENTER."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Move the red dot to the screen borders (framed area) and press ENTER to scroll in the respective direction. Scroll to the headline that says „Scroll here“, then scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Move the red dot over the button that says 'Select me!' and confirm with ENTER."
            break;
        case Tasks.TEST:
            this.taskInstructions = "You can move the red dot with your eye-gaze. To select the button, move the dot over it and confirm with ENTER."
            break;
      }
    }
    if(this.input == InputType.MIX2){
      this.inputMethodInstructions = "Move the cursor with your eye-gaze. With the mouse you can override eye input and thus do the finetuning of the cursor movement."
      switch(this.task){
        case Tasks.HOVER:
          this.taskInstructions = "Move the cursor over the button that says 'Hover over me!'."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Move the cursor to the screen borders (framed area) to scroll in the respective direction. Scroll to the headline that says „Scroll here“, then scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Move the cursor over the button that says 'Select me!'. Click (with your mouse) to select the button."
            break;        
        case Tasks.TEST:
            this.taskInstructions = "You can move the cursor with your eye-gaze. With the mouse you can override the eye input and thus do the finetuning of the cursor movement. To select the button, move the cursor over it and click (with your mouse). To exit this input method, press the escape key."
            break;
      }
    }
    if(this.input == InputType.MOUSE){
      this.inputMethodInstructions = "Use the mouse, like you normally would."
      switch(this.task){
        case Tasks.HOVER:
          this.taskInstructions = "Hover over the button that says 'Hover over me!'."
          break;
        case Tasks.SCROLL:
          this.taskInstructions = "Scroll to the headline that says „Scroll here“. Then, scroll to the top of the page again."
          break;
        case Tasks.SELECT:
            this.taskInstructions = "Click the button that says 'Select me!'."
            break;
        case Tasks.TEST:
            this.taskInstructions = "Click this button using the mouse, like you normally would."
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
