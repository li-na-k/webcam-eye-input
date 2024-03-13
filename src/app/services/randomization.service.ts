import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { InputType } from '../enums/input-type';
import { Positions } from '../enums/positions';
import { Sizes } from '../enums/sizes';
import { Tasks } from '../enums/tasks';
import { AppState } from '../state/app.state';
import { changeInputType, changeTask } from '../state/expConditions/expconditions.action';
import { selectTask, selectInputType } from '../state/expConditions/expconditions.selector';
import { TaskEvaluationService } from './task-evaluation.service';
import { RepObject } from '../classes/rep-object';
import { HttpClient } from '@angular/common/http';

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

  //order of reps
  public inputOrder : InputType[] = [InputType.MIX2, InputType.MOUSE];
  public taskOrder : Tasks[] = [Tasks.SELECT];
  public repOrder : RepObject[] = []
  public inputsDone : number = 0; 
  public tasksDone : number = 0;
  public repsDone : number = 0;
  //current rep
  public selectedSize : Sizes =  Sizes.S;
  public successTargetOnScreen1 : boolean = true;
  public selectedPos : Positions = Positions.POS1
  public getUnselectedPos(): Positions {
      if (this.selectedPos == Positions.POS1) {
        return Positions.POS2;
      }
      else{
        return Positions.POS1
      }
  }

  //final page after finishing inputs 
  public everythingDone: boolean = false;
  public showFinalPageComponent : boolean = false;

  messageSubject = new Subject();
  
  constructor(private store : Store<AppState>, private taskEvaluationService : TaskEvaluationService, private http: HttpClient) { 
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
    this.repsDone = 0;
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

  public async nextRep() : Promise<void> {
    //endTask(); must be called separatly!
    if(this.repsDone + 1 < this.repOrder.length){
      this.selectedSize = this.repOrder[this.repsDone+1].size;
      this.taskEvaluationService.selectedSize = this.selectedSize;
      this.successTargetOnScreen1 = this.repOrder[this.repsDone+1].mainScreen;
      this.taskEvaluationService.targetOnMainScreen = this.successTargetOnScreen1;
      this.selectedPos = this.repOrder[this.repsDone+1].pos;
      this.taskEvaluationService.pos = this.selectedPos;
      if(this.repOrder[this.repsDone+1].numberInBlock == 0){
        await this.nextBlockAssignment(this.repsDone+1);
      }
      this.repsDone++;
      this.taskEvaluationService.startTask();
    }
    else{ 
      this.nextTask();
    }
    return
  }

  private async nextBlockAssignment(nextRep: number): Promise<void> {
    try {
      await this.playNumberAudio(this.repOrder[nextRep].pos, this.repOrder[nextRep].mainScreen);
      await this.playNumberAudio(this.repOrder[nextRep + 1].pos, this.repOrder[nextRep + 1].mainScreen);
      await this.playNumberAudio(this.repOrder[nextRep + 2].pos, this.repOrder[nextRep + 2].mainScreen);
      await this.playNumberAudio(this.repOrder[nextRep + 3].pos, this.repOrder[nextRep + 3].mainScreen);
      return;
    } catch (error) {
      console.error("An error occurred while playing the sounds:", error);
      return;
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
    this.readAndShuffleRepOrderFromCSV("assets/repOrder.csv").then((repOrder)=>{
      this.repOrder = repOrder
      console.log("repOrder for next task:",this.repOrder);
      //TODO cannot call nextRep instead of lines below? (without: this.taskEvaluationService.startTask())?
      this.selectedSize = this.repOrder[this.repsDone+1].size; //first size
      this.taskEvaluationService.selectedSize = this.selectedSize;
      this.successTargetOnScreen1 = this.repOrder[this.repsDone+1].mainScreen; //first screen
      this.taskEvaluationService.targetOnMainScreen = this.successTargetOnScreen1;
      this.selectedPos = this.repOrder[this.repsDone+1].pos; //first pos
      this.taskEvaluationService.pos = this.selectedPos;
    })
  }

  private async readFileFromAssets(filePath: string): Promise<string> {
    try {
      const data = await firstValueFrom(this.http.get(filePath, { responseType: 'text' }));
      return data as string;
    } catch (error) {
      console.error('Error reading file:', error);
      return ''; // Return an empty string or handle the error accordingly
    }
  }

  private async readAndShuffleRepOrderFromCSV(filename: string): Promise<RepObject[]> {
    const repOrder: RepObject[] = [];
    try{
      const fileContent = await this.readFileFromAssets(filename)
      const lines: string[] = fileContent.trim().replace(/\r/g, '').split('\n');
      this.shuffle(lines)
      lines.forEach((line: string) => {
        const parts: string[] = line.split(';');
        const size: Sizes = this.parseEnum(parts[4]);
        const positions : number[] = parts.slice(0, 4).map((numStr: string) => parseInt(numStr));
        positions.forEach((num : number, index : number) => {
          const pos : Positions = num%2==0?Positions.POS2:Positions.POS1;
          const mainScreen : boolean = num<=2?true:false;
          repOrder.push({pos: pos, mainScreen: mainScreen, size: size, numberInBlock: index});
        })
      });
    }
    catch (error){
      console.error("Error while reading the file: ", error)
    }
    return repOrder;
  }

  private parseEnum(value: string): Sizes {
    return value as Sizes;
}


}
