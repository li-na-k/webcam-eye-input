import { Component, OnInit } from '@angular/core';
import { RandomizationService } from '../services/randomization.service';

@Component({
  selector: 'app-final-page',
  templateUrl: './final-page.component.html',
  styleUrls: ['./final-page.component.css']
})
export class FinalPageComponent implements OnInit {

  constructor(public randomizationService : RandomizationService) { }

  questionnaireCountdownDone : boolean = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.questionnaireCountdownDone = true;
    }, 10000)
  }

}
