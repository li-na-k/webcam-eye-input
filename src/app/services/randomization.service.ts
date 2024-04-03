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
  public inputOrder : InputType[] = [InputType.MOUSE];
  public taskOrder : Tasks[] = [Tasks.SELECT];
  public repOrder : RepObject[] = []
  public inputsDone : number = 0; 
  public tasksDone : number = 0;
  public repsDone : number = -1;
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

    this.selectedInputType$ //unsubscribing not necessary since angular services are singleton -> no memory leak
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
    let currentIndex : number = array.length,  randomIndex;
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
    this.repsDone = -1; //will be set to 0 at call of nextRep
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

  public async nextRep(): Promise<void> { //endTask(); must be called separately!
    return new Promise<void>(async (resolve, reject) => {
      this.repsDone++;
      console.log("repsDone:", this.repsDone)
      if (this.repsDone < this.repOrder.length) {
        this.taskEvaluationService.numberInBlock = this.repOrder[this.repsDone].numberInBlock;
        this.selectedSize = this.repOrder[this.repsDone].size;
        this.taskEvaluationService.selectedSize = this.selectedSize;
        this.successTargetOnScreen1 = this.repOrder[this.repsDone].mainScreen;
        this.taskEvaluationService.targetOnMainScreen = this.successTargetOnScreen1;
        this.selectedPos = this.repOrder[this.repsDone].pos;
        this.taskEvaluationService.pos = this.selectedPos;
        if (this.repOrder[this.repsDone].numberInBlock == 0) {
          await this.playBlockSound(this.repsDone)
          setTimeout(()=>{
            this.taskEvaluationService.startTask();
            resolve();
          }, 500)
        } else {
          this.taskEvaluationService.startTask();
          resolve();
        }
      } else {
        this.nextTask();
        resolve();
      }
    });
  }

  public getNextBlockNumbers(rep : number) : number[]{
    let nextBlock : number[] = []
    nextBlock.length = 0
    if (rep < this.repOrder.length - 3) {
      for(let i = rep; i < rep+4; ++i){
        nextBlock.push(this.getTargetNumber(this.repOrder[i].pos, this.repOrder[i].mainScreen))
      }
    } else {
      console.error("No next Block. NextRep index out of bounds.")
    }
    return nextBlock
  }

  private async playBlockSound(rep: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      setTimeout(async () => {
        try {
          let nextBlock = this.getNextBlockNumbers(rep) 
            for (let num of nextBlock){
              await this.playNumberAudio(num);
           }
          resolve(true);
        } catch (error) {
          console.error("An error occurred while playing the sounds:", error);
          reject(error);
        }
      }, 500);
    });
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

  private getTargetNumber(pos: Positions, mainScreen : boolean) : number {
    let number = 0
    if(mainScreen){
      number = (Number(pos) + 2)
    }
    else{
      number = Number(pos);
    }
    return number;
  }

  public playNumberAudio(num : number) : Promise<Event>{
    let numberString : string = String(num)
    let src : string = "assets/number-" + numberString + ".mp3";
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
    })
  }

  private async readFileFromAssets(filePath: string): Promise<string> {
    try {
      const data : string = await firstValueFrom(this.http.get(filePath, { responseType: 'text' }));
      return data;
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
