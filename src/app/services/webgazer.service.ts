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

  private dot : HTMLElement | null = null;
  private secondWebgazer: any;
  private secondWebgazerDot: HTMLElement | undefined;
  public secondFakeFocussed : boolean = false;

  public pauseWebgazer(){ 
    this.dot = document.getElementById("webgazerGazeDot");
    this.paused = true;
    webgazer.pause();
    if(this.dot){
      this.dot!.style.display = "none";
      this.dot!.style.opacity = "0";
    }
  }

  public resumeWebgazer(secondWebgazerToStop? : any, secondWebgazerDot? : HTMLElement){ 
    this.paused = false;
    webgazer.resume();
    if(this.dot){
      this.dot!.style.display = "block";
      this.dot!.style.opacity = "1";
    }
    if(secondWebgazerToStop && secondWebgazerDot){
      this.secondWebgazer = secondWebgazerToStop; 
      this.secondWebgazerDot = secondWebgazerDot;
    }
  }

  public startWebgazer(){
    webgazer.setGazeListener((data : any) => {
        if (data == null) {
          return;
        }
        let active = document.hasFocus();
        if((!active || this.secondFakeFocussed) && this.secondWebgazer){
          this.secondWebgazer.resume();
          this.secondWebgazerDot!.style.display = "block";
          this.secondWebgazerDot!.style.opacity = "1";
          this.pauseWebgazer();
          return;
        }
        //store current x and y pos
        this.store.dispatch(changeXPos({newx: data.x}));
        this.store.dispatch(changeYPos({newy: data.y}));
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


