import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { selectCurrentEyePos } from './state/eyetracking.selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'eye-input-visualization';

  //settings
  public clickGoal = 2;
  public numberOfCPt = 6*3;

  //current state
  public calibrationDone = true; //false;
  public buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  public greenPtCount : number = 0;
  public currentEyePos$ : Observable<number[]> = this.store.select(selectCurrentEyePos);

  constructor(private store : Store<AppState>){}

  public changeButtonColor(buttonNr: number){
    this.buttonClicks[buttonNr]++
    var button = document.getElementById("CPt"+buttonNr)
    if(button && this.buttonClicks[buttonNr] == this.clickGoal){ //turns green
      button.style.backgroundColor = "LimeGreen"
      this.greenPtCount++;
      if(this.greenPtCount == this.numberOfCPt){
        this.calibrationDone = true;
        this.startTestTracking();
      }
    }
    else if(button){
      button.style.opacity = "1.0";
      button.style.borderColor = "LimeGreen"
      var newBorderWidth = this.buttonClicks[buttonNr] + 2;
      button.style.borderWidth = String(newBorderWidth)+"px";
    }
  }

  startTestTracking(){

  }
}  





