import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from '../state/eyetracking/eyetracking.selector';
import { AppState } from '../state/app.state';

@Component({
  selector: 'app-hover',
  templateUrl: './hover.component.html',
  styleUrls: ['./hover.component.css']
})
export class HoverComponent implements OnInit {

  public currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);

  constructor(private store : Store<AppState>) { }

  ngOnInit(): void {
    //this.currentEyePos$.subscribe(d => console.log(d));
  }

}
