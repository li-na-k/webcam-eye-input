import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil, throttleTime } from 'rxjs';
import io from 'socket.io-client';
import { AppState } from '../state/app.state';
import { changeScreen, changeXPos, changeYPos } from '../state/eyetracking/eyetracking.action';
import { selectCurrentScreen } from '../state/eyetracking/eyetracking.selector';
import { Screens } from '../enums/screens';

@Injectable({
  providedIn: 'root'
})

export class SocketService {

  private socket : any;
  private currentScreen$ : Observable<any> = this.store.select(selectCurrentScreen);
  private destroy$ : Subject<boolean> = new Subject<boolean>();
  private screen : Screens = Screens.MAINSCREEN;

  constructor(private store : Store<AppState>){
    this.socket = io('http://localhost:8080', {autoConnect: true, reconnection: true});
    this.currentScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => {
        this.screen = d;
    });
  }

  startSendingGazeData(){
    console.log("start sending gaze data")
    this.socket.emit("startSendingGazeData");
    this.listenTo("gazeData")
    .subscribe((data : any) => {
      //store current x and y pos
        this.store.dispatch(changeXPos({newx: data.norm_pos[0]}));
        this.store.dispatch(changeYPos({newy: data.norm_pos[1]}));
        this.store.dispatch(changeScreen({newScreen: data.name}));
    });
  }

  stopSendingGazeData(){
    this.socket.emit("stopSendingGazeData");
  }

  startCalibration(){
    this.socket.emit("calibrate");
  }

  private listenTo(event : string){
    return new Observable((subscriber) => {
      this.socket.on(event, (data : any) => {
        subscriber.next(data)
      })
    })
  }

}
