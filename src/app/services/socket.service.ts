import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import io from 'socket.io-client';
import { AppState } from '../state/app.state';
import { changeXPos, changeYPos } from '../state/eyetracking/eyetracking.action';

@Injectable({
  providedIn: 'root'
})

export class SocketService {

  private socket : any;

  constructor(private store : Store<AppState>){
    this.socket = io('http://localhost:8080', {autoConnect: true, reconnection: true});
  }

  startSendingGazeData(){
    this.socket.emit("startSendingGazeData");
    this.listenTo("gazeData").subscribe((data : any) => {
      //store current x and y pos
      this.store.dispatch(changeXPos({newx: data.gaze_on_surfaces[0].norm_pos[0]})); //TODO warum mehrere gaze on surfaces und dann wieder keine?
      this.store.dispatch(changeYPos({newy: data.gaze_on_surfaces[0].norm_pos[1]}));
    });
  }

  stopSendingGazeData(){
    this.socket.emit("stopSendingGazeData");
  }

  private listenTo(event : string){
    return new Observable((subscriber) => {
      this.socket.on(event, (data : any) => {
        subscriber.next(data)
      })
    })
  }

}
