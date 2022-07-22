import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { selectCurrentEyePos } from './state/eyetracking.selector';


declare var webgazer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'eye-input-visualization';

  ngOnInit(): void {
      this.showPopup = true;
  }

  //settings
  public clickGoal = 2;
  public numberOfCPt = 6*3;

  //current state
  public calibrationDone = false;
  public buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  public greenPtCount : number = 0;
  public currentEyePos$ : Observable<number[]> = this.store.select(selectCurrentEyePos);
  public showPopup = false;

  constructor(private store : Store<AppState>){}

  public startWebgazer(){
    var startButton = document.getElementById("startButton");
    if(startButton){startButton.style.display="none"};
    webgazer.setGazeListener(function(data : any, elapsedTime : any) {
        if (data == null) {
            return;
        }
        var xDisplay = document.getElementById("x");
        var yDisplay = document.getElementById("y");
        if(xDisplay){xDisplay.innerHTML = data.x;}
        if(yDisplay){yDisplay.innerHTML = data.y;}
        //document.getElementById("time").innerHTML = elapsedTime;
    }).begin();
  }

  public paused = false;

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
        this.startTestTracking();
      }
    }
    else if(button){
      button.style.opacity = "1.0";
      button.style.borderColor = "var(--green)";
      var newBorderWidth = this.buttonClicks[buttonNr] + 2;
      button.style.borderWidth = String(newBorderWidth)+"px";
    }
  }

  startTestTracking(){

  }
}  





