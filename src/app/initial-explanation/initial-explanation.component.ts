import { Component, EventEmitter, Output } from '@angular/core';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-initial-explanation',
  templateUrl: './initial-explanation.component.html',
  styleUrls: ['./initial-explanation.component.css']
})
export class InitialExplanationComponent {

    constructor(protected socketService : SocketService) { 
    }

    @Output() closeMe = new EventEmitter<boolean>();

    protected currentInstruction : number = 0;
    protected numberInstructions : number = 3;
    protected disabledNext = true; //default disable next button on first slide where second window should be opened
  
    protected nextExplanation(){
      if(this.currentInstruction >= (this.numberInstructions-1)){
        this.closePopup();
      }
      this.currentInstruction = this.currentInstruction+1; 
    }
  
    protected previousExplanation(){
      this.currentInstruction = this.currentInstruction-1; 
    }

    protected closePopup(){
      this.closeMe.emit(true);
      this.currentInstruction = 0; //reset in case re-opened
    }

}
