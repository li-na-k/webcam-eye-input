import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.css']
})
export class CalibrationComponent implements OnInit{

  constructor() { }

  @Output() calibrationDoneEvent = new EventEmitter<boolean>();
  @Input() calibrationExplanationShown : boolean = true;
  public showPopup : boolean = true;

  public numberOfCPt = 9;
  public buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  public greenPtCount : number = 0;
  //settings
  public clickGoal = 5;
  //explanation
  protected explanationNr : number = 0;

  ngOnInit(){
    var dot = document.getElementById("webgazerGazeDot");
    dot!.style.visibility = "visible";
    dot!.style.opacity = "1";
    this.showPopup = !this.calibrationExplanationShown; //if calibration explanation was already shown, do not show second time
  }

  public changeButtonColor(buttonNr: number){
    if(this.buttonClicks[buttonNr] < this.clickGoal){
      this.buttonClicks[buttonNr]++
      let button = document.getElementById("CPt"+buttonNr)
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

  public closePopup(){
    this.showPopup = false;
    this.explanationNr = 1;
  }

  public numberInstructions : number = 4;
  public nextExplanation(){
    if(this.explanationNr >= (this.numberInstructions-1)){
      this.closePopup();
    }
    this.explanationNr = this.explanationNr+1; 
  }

  public previousExplanation(){
    this.explanationNr = this.explanationNr-1; 
  }

}

