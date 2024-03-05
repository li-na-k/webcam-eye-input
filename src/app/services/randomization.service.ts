import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { InputType } from '../enums/input-type';
import { Positions } from '../enums/positions';
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
  private task : Tasks = Tasks.SELECT;
  public taskInstructions : string = "";
  public inputMethodInstructions : string = "";

  // store
  private selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  private selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);

  //order of tasks
  public inputOrder : InputType[] = [InputType.MIX2, InputType.MOUSE];
  public taskOrder : Tasks[] = [Tasks.SELECT];
  public positionOrder : Positions[] = [Positions.POS1, Positions.POS2];
  public inputsDone : number = 0; 
  public tasksDone : number = 0;

  // each input method: 2 different sizes, each 20 repetitions (position is random!)
  public sizeOrder = [Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.S, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L, Sizes.L];
  public repsDone : number = 0;
  public selectedSize : Sizes =  this.sizeOrder[0];

  //order: target on screen 2 or 1?
  public successTargetOnScreen1Order : boolean[] = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
  public successTargetOnScreen1 : boolean = this.successTargetOnScreen1Order[0];

  //final page after finishing inputs 
  public everythingDone: boolean = false;
  public showFinalPageComponent : boolean = false;

  messageSubject = new Subject();
  
  constructor(private store : Store<AppState>, private taskEvaluationService : TaskEvaluationService) { 
    this.randomizeExperiment();

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
  private shuffle(array : any[]) : any[]{
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  public nextInputMethod() : void{ 
    this.tasksDone = 0;
    if(this.inputsDone < this.inputOrder.length){
      this.selectInputType(this.inputOrder[this.inputsDone])
      this.inputsDone++;
      this.nextTask(); //first task
    }
    else{
      this.everythingDone = true;
    }
  }

  private nextTask() : void{
    this.randomizeNewTask()
    this.repsDone = 20;
    if(this.tasksDone < this.taskOrder.length){
      this.selectTask(this.taskOrder[this.tasksDone])
      this.tasksDone++;
      this.messageSubject.next('nextTask'); // emit event: popup with explanation + confirm button that activates input method should be displayed in app.component
    }
    else{
      this.messageSubject.next('nextTask');
      this.showFinalPageComponent = true;
      this.nextInputMethod();
    }
  }

  public nextRep() : void {
    //endTask(); must be called separatly!
    if(this.repsDone + 1 < this.sizeOrder.length){
      this.selectedSize = this.sizeOrder[this.repsDone+1];
      this.taskEvaluationService.selectedSize = this.selectedSize;
      this.shuffle(this.positionOrder);
      this.successTargetOnScreen1 = this.successTargetOnScreen1Order[this.repsDone+1]; 
      this.taskEvaluationService.targetOnMainScreen = this.successTargetOnScreen1;
      this.taskEvaluationService.pos = this.positionOrder[0];
      this.playNumberAudio(this.positionOrder[0], this.successTargetOnScreen1).then(() => {
        this.repsDone++;
        this.taskEvaluationService.startTask();
      })
    }
    else{ 
      this.nextTask();
    }
  }

  public selectTask(task : Tasks) : void{
    this.store.dispatch(changeTask({newTask: task}));
    this.setInstruction(); 
  }

  public selectInputType(inputType : InputType) : void{
    this.store.dispatch(changeInputType({newInputType: inputType}));
    this.setInstruction();
  }

  private setInstruction() : void{
    if(this.input == InputType.MIX2){
      this.inputMethodInstructions = "Move the cursor with your eye-gaze. Move your mouse to override the eye input and thus do the finetuning of the cursor movement."
      switch(this.task){
        case Tasks.SELECT:
            this.taskInstructions = "Move the cursor over the button that says 'Select me!'. Click (with your mouse) to select the button."
            break;        
        case Tasks.TEST:
            this.taskInstructions = "You can move the cursor with your eye-gaze. <strong>You can also move your mouse to override the eye input</strong> and thus do the finetuning of the cursor movement. To select the button, move the cursor over it and click (with your mouse)."
            break;
      }
    }
    if(this.input == InputType.MOUSE){
      this.inputMethodInstructions = "Use the mouse, like you normally would."
      switch(this.task){
        case Tasks.SELECT:
            this.taskInstructions = "Click the button that says 'Select me!'."
            break;
        case Tasks.TEST:
            this.taskInstructions = "Click this button using the mouse, like you normally would."
            break;
      }
    }
  }

  public playNumberAudio(number : Positions, mainScreen : boolean) : Promise<Event>{
    let numberString : string = "1";
    if(mainScreen){
      numberString = String(Number(number) + 2)
    }
    else{
      numberString = number;
    }
    let src = "assets/number-" + numberString + ".mp3";
    return this.taskEvaluationService.playAudio(src); 
  }

  private randomizeExperiment() : void{
    this.shuffle(this.inputOrder);
    this.shuffle(this.taskOrder);
    console.log(this.inputOrder);
    console.log(this.taskOrder);
  }

  private randomizeNewTask(){
    this.shuffle(this.sizeOrder); 
    this.shuffle(this.successTargetOnScreen1Order);
    console.log(this.sizeOrder);
    console.log(this.successTargetOnScreen1Order);
    this.selectedSize = this.sizeOrder[0]; //first size
    this.successTargetOnScreen1 = this.successTargetOnScreen1Order[0]; //first screen
    this.taskEvaluationService.selectedSize = this.selectedSize;
    this.taskEvaluationService.targetOnMainScreen = this.successTargetOnScreen1;
  }

  //note: position shuffled on every rep

}
