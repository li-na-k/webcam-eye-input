import { Component, Input, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.css']
})
export class CalibrationComponent /*implements OnInit*/ {

  constructor() { }

  // ngOnInit(): void {
  //   console.log("init called calib")
  // }

  // ngOnDestroy(){
  //   console.log("calib destroyed")
  // }

  @Output() calibrationDoneEvent = new EventEmitter<boolean>();
  @Input() showPopup : boolean = true;

  public numberOfCPt = 6*4;
  public buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  public greenPtCount : number = 0;
  //public showPopup = true;
  //settings
  public clickGoal = 2;
  //explanation
  public explanationNr : number = 0;

  public changeButtonColor(buttonNr: number){
    this.buttonClicks[buttonNr]++
    var button = document.getElementById("CPt"+buttonNr)
    if(button && this.buttonClicks[buttonNr] == this.clickGoal){ //turns green
      button.style.backgroundColor = "var(--green)"
      this.greenPtCount++;
      if(this.greenPtCount == this.numberOfCPt){
        this.calibrationDoneEvent.emit(true);
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
    console.log("show")
    this.showPopup=true;
    this.explanationNr = 0;
  }

}

