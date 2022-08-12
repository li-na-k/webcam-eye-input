import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from '../state/eyetracking/eyetracking.selector';
import { AppState } from '../state/app.state';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent implements OnInit {

  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {
    var scrollAreas = document.getElementsByClassName("scroll-area");
    var inside : boolean = false;
    setInterval(() => {
      for(var i = 0; i < scrollAreas.length; i++){
        var el : HTMLElement = scrollAreas[i] as HTMLElement;
    
        if(el){
          inside = this.eyesOnlyInput.checkIfInsideElement(el);
        }
        if (inside == true && el){
          window.scrollBy(0, 10)
        }
        else if(inside == false && el){
          //do nothing
        }
      }
    }, 100)

  }
}



    

