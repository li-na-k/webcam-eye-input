import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from '../state/eyetracking/eyetracking.selector';
import { AppState } from '../state/app.state';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';

@Component({
  selector: 'app-hover',
  templateUrl: './hover.component.html',
  styleUrls: ['./hover.component.css']
})
export class HoverComponent implements OnInit {

  public currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);

  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {
    setInterval(() => {
      var inside : boolean | undefined = this.eyesOnlyInput.checkIfInsideRect();
      var el = document.getElementById("rect");
      console.log(inside);
      if (inside == true && el){
        el.style.backgroundColor = "var(--apricot)";
      }
      else if(inside == false && el){
        el.style.backgroundColor = "var(--blue)";
      }
    }, 100);
  }

}
