import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ignoreElements, Observable } from 'rxjs';
import { AppState } from './state/app.state';
import { InputType } from './enums/input-type';
import { Tasks } from './enums/tasks';
import {changeXPos, changeYPos} from './state/eyetracking/eyetracking.action'
import { changeInputType, changeTask } from './state/expConditions/expconditions.action';
import { selectTask } from './state/expConditions/expconditions.selector';
import { selectInputType } from './state/expConditions/expconditions.selector';
import { ScrollComponent } from './scroll/scroll.component';
import { HoverComponent } from './hover/hover.component';
import { ClickComponent } from './click/click.component';





declare var webgazer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'eye-input-visualization';
  @ViewChild(ScrollComponent) scrollComponent!: ScrollComponent;
  @ViewChild(HoverComponent) hoverComponent!: ScrollComponent;
  @ViewChild(ClickComponent) clickComponent!: ScrollComponent;

  ngOnInit(): void {
      this.showPopup = true;
      if(!this.paused){
        this.startWebgazer();
        this.checkWebGazerLoaded();
      }
  }

  public poi = [0,1,2,3,4,5,6,7];
  public InputType = InputType;
  public TaskType = Tasks;
  public instructions : string = "Please select a task first, then the input method!";

  //settings
  public clickGoal = 2;
  public numberOfCPt = 6*4;

  //current state webgazer
  public webgazerLoaded : boolean = false;
  public paused = false;
  public calibrationDone : boolean = false;
  public buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  public greenPtCount : number = 0;
  public showPopup = false;

  public xprediction = 0.0;
  public yprediction = 0.0;

  //experiment - only for dispatching into store && default value?? todo
  public selectedTask : Tasks = Tasks.SELECT;
  public selectedInputType : InputType = InputType.EYE;
  //store
  public selectedTask$ : Observable<Tasks> = this.store.select(selectTask);
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);


  //explanation
  public explanationNr : number = 0;

  constructor(private store : Store<AppState>){}

  public startWebgazer(){
    var store = this.store;
    var poi = this.poi;
    webgazer.setGazeListener(function(data : any, elapsedTime : any) {
        if (data == null) {
            return;
        }
        //store current x and y pos
        store.dispatch(changeXPos({newx: data.x}));
        store.dispatch(changeYPos({newy: data.y}));

        //display current x and y
        var xDisplay = document.getElementById("x");
        var yDisplay = document.getElementById("y");
        if(xDisplay){xDisplay.innerHTML = data.x;}
        if(yDisplay){yDisplay.innerHTML = data.y;}
    }).begin()
  }



  public interval : any;
  checkWebGazerLoaded = () => {
    this.interval = setInterval(() => {
        if(webgazer.isReady()) {
            this.webgazerLoaded = true;
            console.log('webgazer loaded: ',webgazer)
            clearInterval(this.interval)
        }
    },1000)
}

  public pauseWebgazer(){
    if(this.paused){
      this.paused = false;
      webgazer.resume()
    }
    else{
      this.paused = true;
      webgazer.pause()
    }
  }


  public changeButtonColor(buttonNr: number){
    this.buttonClicks[buttonNr]++
    var button = document.getElementById("CPt"+buttonNr)
    if(button && this.buttonClicks[buttonNr] == this.clickGoal){ //turns green
      button.style.backgroundColor = "var(--green)"
      this.greenPtCount++;
      if(this.greenPtCount == this.numberOfCPt){
        this.calibrationDone = true;
        this.showPopup=true;
      }
    }
    else if(button){
      button.style.opacity = "1.0";
      button.style.borderColor = "var(--green)";
      var newBorderWidth = this.buttonClicks[buttonNr] + 2;
      button.style.borderWidth = String(newBorderWidth)+"px";
    }
  }

  public numberInstructions : number = 4;
  public nextExplanation(){
    if(this.explanationNr >= (this.numberInstructions-1)){
      this.showPopup=false;
    }
    this.explanationNr = this.explanationNr+1; 
  }

  public previousExplanation(){
    this.explanationNr = this.explanationNr-1; 
  }

  public showExplanation(){
    this.showPopup=true;
    this.explanationNr = 0;
  }

  public selectTask(){
    this.store.dispatch(changeTask({newTask: this.selectedTask}));
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


  public selectInputType(){
    this.store.dispatch(changeInputType({newInputType: this.selectedInputType}));
    if(this.scrollComponent){
      this.scrollComponent.activateSelectedInputType();
    }
    if(this.hoverComponent){
      this.hoverComponent.activateSelectedInputType();
    }
    if(this.clickComponent){
      this.clickComponent.activateSelectedInputType();
    }
    this.setInstruction();
  }




}  





