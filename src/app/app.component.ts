import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { selectCurrentEyePos } from './state/eyetracking.selector';
import { changeXPos } from './state/eyetracking.action';
import { changeYPos } from './state/eyetracking.action';
import { ChartOptions } from 'chart.js';


declare var webgazer: any;
declare var Chart: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'eye-input-visualization';

  ngOnInit(): void {
      this.showPopup = true;
      this.startWebgazer();
      this.checkWebGazerLoaded();
  }

  public poi = [0,1,2,3,4,5,6,7];

  //settings
  public clickGoal = 2;
  public numberOfCPt = 6*4;

  //current state
  public webgazerLoaded : boolean = false;
  public calibrationDone : boolean = false;
  public buttonClicks : Array<number> = new Array(this.numberOfCPt).fill(0);
  public greenPtCount : number = 0;
  public currentEyePos$ : Observable<number[]> = this.store.select(selectCurrentEyePos);
  public showPopup = false;

  public xprediction = 0.0;
  public yprediction = 0.0;

  //explanation
  public explanationNr : number = 0;

  constructor(private store : Store<AppState>){}

  public startWebgazer(){
    //var store = this.store
    //store.dispatch(changeYPos({newy: 123.0}));
    //var rect2 = document.getElementById("TestPt2")?.getBoundingClientRect();
    //console.log(rect2?.top + " / " + rect2?.right + " / " + rect2?.bottom + " / " + rect2?.left)
    var poi = this.poi;
    webgazer.setGazeListener(function(data : any, elapsedTime : any) {
        if (data == null) {
            return;
        }
        var xDisplay = document.getElementById("x");
        var yDisplay = document.getElementById("y");
        if(xDisplay){xDisplay.innerHTML = data.x;}
        if(yDisplay){yDisplay.innerHTML = data.y;}

        for (var p in poi){
          var rect = document.getElementById("TestPt" + p)?.getBoundingClientRect();
          if(rect){
            var el = document.getElementById("TestPt" + p);
            if(rect.left <= data.x && rect.right >= data.x && rect.top <= data.y && rect.bottom >= data.y){
              if(el){
                el.style.backgroundColor = "var(--apricot)";
              }
            }
            else{
              if(el){
                el.style.backgroundColor = "var(--blue)";
              }
          }
          }
        }
        //store.dispatch(changeXPos(data.x));
        //store.dispatch(changeYPos({newy: 123.0}));
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


  public paused = false;

  public pauseWebgazer(){
    var rect1 = document.getElementById("TestPt1")?.getBoundingClientRect();
    var rect2 = document.getElementById("TestPt2")?.getBoundingClientRect();
    var point = document.getElementById("webgazerGazeDot")?.getBoundingClientRect();
    console.log("x1: " + rect1?.left + " - " + rect1?.right)
    console.log("y1: " + rect1?.top + " - " + rect1?.bottom)
    console.log("x2: " + rect2?.left + " - " + rect2?.right)
    console.log("y2: " + rect2?.top + " - " + rect2?.bottom)
    console.log(point?.x + " / " + point?.y)
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


    // Pie
    public pieChartOptions: ChartOptions<'pie'> = {
      responsive: false,
    };
    public pieChartLabels = [ [ '1' ], [ '2' ], '3' ];
    public pieChartDatasets = [ {
      data: [ 300, 500, 100 ]
    } ];
    public pieChartLegend = true;
    public pieChartPlugins = [];




}  





