import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RandomizationService } from '../services/randomization.service';

@Component({
  selector: 'app-final-page',
  templateUrl: './final-page.component.html',
  styleUrls: ['./final-page.component.css']
})
export class FinalPageComponent implements OnInit {

  constructor(public randomizationService : RandomizationService) { }

  questionnaireCountdownDone : boolean = false;
  @Output() calibrationDoneEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    setTimeout(() => {
      this.questionnaireCountdownDone = true;
    }, 20000)
  }

  confirmNextInput(){
    this.randomizationService.showQuestionnaireInfo = false; 
    this.calibrationDoneEvent.emit(false); 
  }

}
