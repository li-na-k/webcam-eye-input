import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentEyePos } from 'src/app/state/eyetracking/eyetracking.selector';
import { AppState } from 'src/app/state/app.state';


@Injectable({
  providedIn: 'root'
})
export class EyesOnlyInputService implements OnDestroy {

  public currentEyePos$ : Observable<any> = this.store.select(selectCurrentEyePos);

  constructor(private store : Store<AppState>) { }

  public checkIfInsideElement(el : HTMLElement) : boolean{
    var x = 0.0;
    var y = 0.0;
    this.currentEyePos$.subscribe(d => {
      x = d.x;
      y = d.y;
    });

    var boundingBox = el.getBoundingClientRect();
    if(
      (boundingBox.left <= x || boundingBox.left == 0) && 
      (boundingBox.right >= x || boundingBox.right == 0) && 
      (boundingBox.top <= y || boundingBox.top == 0) && 
      (boundingBox.bottom >= y || boundingBox.bottom == 0)){
      return true;
    }
    else{
      return false;   
    }
  }




  // public checkIfInsideClassElements(classname : string) : boolean | undefined{
  //   var x = 0.0;
  //   var y = 0.0;
  //   this.currentEyePos$.subscribe(d => {
  //     x = d.x;
  //     y = d.y;
  //   });

  //   var elements : HTMLCollectionOf<Element> = document.getElementsByClassName(classname);
  //   for(var i = 0; i < elements.length; i++){
  //     var el = elements[i];
  //     var boundingBox = el.getBoundingClientRect();
  //     if(boundingBox.left <= x && boundingBox.right >= x && boundingBox.top <= y && boundingBox.bottom >= y){
  //       return true;
  //     }
  //     else{
  //       return false;
  //     }
  //   } 
  //   return undefined;
  // }

  ngOnDestroy(): void{
    //todo: cancel subscribe
  }



}