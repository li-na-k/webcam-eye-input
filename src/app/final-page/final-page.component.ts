import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RandomizationService } from '../services/randomization.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';

@Component({
  selector: 'app-final-page',
  templateUrl: './final-page.component.html',
  styleUrls: ['./final-page.component.css']
})
export class FinalPageComponent implements OnInit {

  constructor(public randomizationService : RandomizationService, protected taskEvaluationService : TaskEvaluationService) { }

  protected questionnaireCountdownDone : boolean = false;
  protected showExportPage : boolean = false;

  @Output() calibrationDoneEvent = new EventEmitter<boolean>();

  ngOnInit(): void {
    setTimeout(() => {
      this.questionnaireCountdownDone = true;
    }, 0)
  }

  confirmNextInput(){
    this.randomizationService.showFinalPageComponent = false; 
    this.calibrationDoneEvent.emit(false); 
  }

  goToExportPage(){
    this.showExportPage = true;
    this.taskEvaluationService.exportResults();
  }

}
