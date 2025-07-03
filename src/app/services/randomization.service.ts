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
import { KeyService } from './key.service';

@Injectable({
  providedIn: 'root'
})
export class RandomizationService {

  private input : InputType = InputType.EYE;
  private task : Tasks = Tasks.SELECT;
  public taskInstructions : string = "";
  public inputMethodInstructions : string = "";

  // store
  private selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);

  public inputOrder : InputType[] = [InputType.MOUSE]; //! exp. conductor: change this
  public sizeOrder : Sizes[] =  [Sizes.L, Sizes.S]; //! exp. conductor: adapt this
  public participantID : String = "lina"; //! exp. conductor: adapt this

  //order of reps
  public taskOrder : Tasks[] = [Tasks.SELECT];
  public repOrder : RepObject[] = []
  public inputsDone : number = 0; 
  public tasksDone : number = 0;
  public repsDone : number = -1;
  public trialsPerRep = 5; 

  //current rep
  public successTargetOnScreen1 : boolean = true;
  public selectedPos : Positions = Positions.POS1;
  public selectedSize : Sizes = Sizes.L;
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
  
  constructor(
    private store : Store<AppState>, 
    private taskEvaluationService : TaskEvaluationService, 
    private http: HttpClient, 
    private keyService: KeyService
  ){ 
    this.selectedInputType$ //unsubscribing not necessary since angular services are singleton -> no memory leak
      .subscribe(d => {
        this.input = d
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
      this.repsDone++;
      console.log("------------ repsDone:", this.repsDone)
      if (this.repsDone < this.repOrder.length) {
        this.taskEvaluationService.numberInBlock = this.repOrder[this.repsDone].numberInBlock;
        this.selectedSize = this.repOrder[this.repsDone].size;
        this.taskEvaluationService.selectedSize = this.selectedSize;
        this.successTargetOnScreen1 = this.repOrder[this.repsDone].mainScreen;
        this.taskEvaluationService.targetOnMainScreen = this.successTargetOnScreen1;
        this.selectedPos = this.repOrder[this.repsDone].pos;
        this.taskEvaluationService.pos = this.selectedPos;
        this.taskEvaluationService.repeated = this.repOrder[this.repsDone].repeated;
        if (this.repOrder[this.repsDone].numberInBlock == 0) {
          await this.keyService.waitForSpaceKey()
          setTimeout(()=>{
            this.taskEvaluationService.startTask();
          }, 500)
        } else {
          this.taskEvaluationService.startTask();
        }
      } else {
        this.nextTask();
      }
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

  addCurrentRepBlockToEndOfExp(){
    // find start of the block
    let startIndex = this.repsDone;
    while (startIndex > 0 && this.repOrder[startIndex].numberInBlock !== 0) {
      startIndex--;
    }
    // push all four items of the current block
    const blockToAdd = this.repOrder.slice(startIndex, startIndex + 4);
    for (let item of blockToAdd) {
      const repeatedItem = { ...item, repeated: true }; // clone and add repeated flag
      this.repOrder.push(repeatedItem);
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
    if(this.input == InputType.MAGIC){
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

  private randomizeNewTask(){
    this.readAndShuffleRepOrderFromCSV("assets/repOrder.csv").then((repOrder)=>{
      this.repOrder = repOrder
      console.log("all repOrder", this.repOrder)

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
      // copy lines to have 5 reps of each condition
      const replicatedLines: string[] = [];
      lines.forEach(line => {
        for (let i = 0; i < this.trialsPerRep; i++) {
          replicatedLines.push(line);
        }
      });
      this.sizeOrder.forEach((size) => {
        this.shuffle(replicatedLines)
        replicatedLines.forEach((line: string) => {
          const parts: string[] = line.split(';');
          const positions : number[] = parts.slice(0, 4).map((numStr: string) => parseInt(numStr));

          positions.forEach((num : number, index : number) => {
            const pos : Positions = num%2==0?Positions.POS2:Positions.POS1;
            const mainScreen : boolean = num<=2?false:true;
              repOrder.push({pos: pos, mainScreen: mainScreen, size, numberInBlock: index, repeated: false});
          })
        });
      });
    } catch (error){
      console.error("Error while reading the file: ", error)
    }
    return repOrder;
  }
}
