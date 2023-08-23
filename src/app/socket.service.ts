import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})

export class SocketService {

  socket : any;

  constructor() { 
    this.socket = io('http://localhost:8080');
  }

  startSendingGazeData(){
    this.socket.emit("startSendingGazeData");
  }

  stopSendingGazeData(){
    this.socket.emit("stopSendingGazeData");
  }

  listenTo(event : string){
    return new Observable((subscriber) => {
      this.socket.on(event, (data : any) => {
        subscriber.next(data)
      })
    })
  }

}
