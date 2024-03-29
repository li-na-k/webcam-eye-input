import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import {changeXPos, changeYPos} from '../state/eyetracking/eyetracking.action'

declare var webgazer : any;

@Injectable({
  providedIn: 'root'
})

export class WebgazerService {

  constructor(private store : Store<AppState>) { }

  public paused : boolean = false;
  public webgazerLoaded : boolean = false;
  public interval : any;

  public togglePauseWebgazer(){ 
    if(this.paused){
      this.paused = false;
      webgazer.resume()
      document.getElementById("webgazerGazeDot")!.style.display = "block";
      document.getElementById("webgazerGazeDot")!.style.opacity = "1";
    }
    else{
      this.paused = true;
      webgazer.pause()
      document.getElementById("webgazerGazeDot")!.style.display = "none";
      document.getElementById("webgazerGazeDot")!.style.opacity = "0";
    }
  }

  public pauseWebgazer(){ 
    this.paused = true;
    webgazer.pause()
    document.getElementById("webgazerGazeDot")!.style.display = "none";
    document.getElementById("webgazerGazeDot")!.style.opacity = "0";
  }

  public resumeWebgazer(){ 
    this.paused = false;
    webgazer.resume()
    document.getElementById("webgazerGazeDot")!.style.display = "block";
    document.getElementById("webgazerGazeDot")!.style.opacity = "1";
  }

  public startWebgazer(){
    let store = this.store;
    webgazer.setGazeListener(function(data : any) {
        if (data == null) {
            return;
        }
        //store current x and y pos
        store.dispatch(changeXPos({newx: data.x}));
        store.dispatch(changeYPos({newy: data.y}));

        //display current x and y
        // let xDisplay = document.getElementById("x");
        // let yDisplay = document.getElementById("y");
        // if(xDisplay){xDisplay.innerHTML = data.x;}
        // if(yDisplay){yDisplay.innerHTML = data.y;}
    }).begin()
  }

  checkWebGazerLoaded = () => {
    this.interval = setInterval(() => {
        if(webgazer.isReady()) {
            this.webgazerLoaded = true;
            console.log('webgazer loaded: ',webgazer)
            clearInterval(this.interval)
        }
    },1000)
}

}


