import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { WebgazerService } from '../services/webgazer.service';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.css']
})
export class CalibrationComponent implements AfterViewInit{
  @ViewChild('dualscreen') dualscreen! : any;

  protected showCalibrationSecondScreen: boolean = false;

  constructor(private webgazerService : WebgazerService) { }

  @Output() calibrationDoneEvent = new EventEmitter<boolean>();
  //two-way data binding
  @Input() showExplanation : boolean = false;
  @Output() showExplanationChange = new EventEmitter<boolean>();

  private numberOfCPt = 2*9;
  private buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  private greenPtCount : number = 0;
  //settings
  protected clickGoal = 5;
  //explanation
  protected explanationNr : number = 0;

  ngAfterViewInit(){
    this.webgazerService.resumeWebgazer();
  }

  protected changeButtonColor(buttonNr: number){
    if(this.buttonClicks[buttonNr] < this.clickGoal){
      this.buttonClicks[buttonNr]++;
      let button = document.getElementById("CPt"+buttonNr);
      button ??= this.dualscreen.secondWindow.document.getElementById("CPt"+buttonNr);
      if(this.buttonClicks[buttonNr] == this.clickGoal){ //turns fully green
        button!.style.backgroundColor = "var(--green)"
        this.greenPtCount++;
        if(this.greenPtCount == this.numberOfCPt){
          this.calibrationDoneEvent.emit(true);
        }
      }
      else {
        button!.style.opacity = "1.0";
        button!.style.borderColor = "var(--green)";
        let newBorderWidth = this.buttonClicks[buttonNr] + 2;
        button!.style.borderWidth = String(newBorderWidth)+"px";
      }
    }
  }

  protected closePopup(){
    this.showExplanation = false;
    this.showExplanationChange.emit(false);
    this.explanationNr = 1;
    this.showCalibrationSecondScreen = true;
  }

  private numberInstructions : number = 5;
  protected nextExplanation(){
    if(this.explanationNr >= (this.numberInstructions-1)){
      this.closePopup();
    }
    this.explanationNr = this.explanationNr+1; 
  }

  protected previousExplanation(){
    this.explanationNr = this.explanationNr-1; 
  }

}

