import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { selectCurrentEyePos } from './state/eyetracking.selector';
import { changeXPos } from './state/eyetracking.action';
import { changeYPos } from './state/eyetracking.action';


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
      this.startWebgazer();
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

  public xprediction = 0.0;
  public yprediction = 0.0;

  constructor(private store : Store<AppState>){}

  


  public startWebgazer(){
    var store = this.store
    //store.dispatch(changeYPos({newy: 123.0}));
    //var rect2 = document.getElementById("TestPt2")?.getBoundingClientRect();
    //console.log(rect2?.top + " / " + rect2?.right + " / " + rect2?.bottom + " / " + rect2?.left)
    webgazer.setGazeListener(function(data : any, elapsedTime : any) {
        if (data == null) {
            return;
        }
        var xDisplay = document.getElementById("x");
        var yDisplay = document.getElementById("y");
        if(xDisplay){xDisplay.innerHTML = data.x;}
        if(yDisplay){yDisplay.innerHTML = data.y;}

        var rect2 = document.getElementById("TestPt2")?.getBoundingClientRect();
        if(rect2){
          if(rect2.left <= data.x && rect2.right >= data.x && rect2.top <= data.y && rect2.bottom >= data.y){ 
            var el = document.getElementById("TestPt2")
            if(el){
              el.style.backgroundColor = "var(--apricot)";
            }
          }
          else{
            var el = document.getElementById("TestPt2")
            if(el){
              el.style.backgroundColor = "var(--blue)";
            }
          }
        }

        var rect1 = document.getElementById("TestPt1")?.getBoundingClientRect();
        if(rect1){
          if(rect1.left <= data.x && rect1.right >= data.x && rect1.top <= data.y && rect1.bottom >= data.y){ 
            var el = document.getElementById("TestPt1")
            if(el){
              el.style.backgroundColor = "var(--apricot)";
            }
          }
          else{
            var el = document.getElementById("TestPt1")
            if(el){
              el.style.backgroundColor = "var(--blue)";
            }
          }
        }

        var rect3 = document.getElementById("TestPt3")?.getBoundingClientRect();
        if(rect3){
          if(rect3.left <= data.x && rect3.right >= data.x && rect3.top <= data.y && rect3.bottom >= data.y){ 
            var el = document.getElementById("TestPt3")
            if(el){
              el.style.backgroundColor = "var(--apricot)";
            }
          }
          else{
            var el = document.getElementById("TestPt3")
            if(el){
              el.style.backgroundColor = "var(--blue)";
            }
          }
        }
        
        var rect4 = document.getElementById("TestPt4")?.getBoundingClientRect();
        if(rect4){
          if(rect4.left <= data.x && rect4.right >= data.x && rect4.top <= data.y && rect4.bottom >= data.y){ 
            var el = document.getElementById("TestPt4")
            if(el){
              el.style.backgroundColor = "var(--apricot)";
            }
          }
          else{
            var el = document.getElementById("TestPt4")
            if(el){
              el.style.backgroundColor = "var(--blue)";
            }
          }
        }
        

       
        //store.dispatch(changeXPos(data.x));
        //store.dispatch(changeYPos({newy: 123.0}));
    }).begin();
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


}  





