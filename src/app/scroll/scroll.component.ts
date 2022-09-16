import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { trigger, style, animate, transition } from '@angular/animations';
@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent extends BaseTasksComponent implements OnInit, OnDestroy {

  public taskElementID: string = "" //TODO: macht hier kein Sinn eigentlich
  public scrollAreas = document.getElementsByClassName("scroll-area");


  constructor(store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) {
    super(store)
   }

  public scroll(scrollArea : HTMLElement){
    if(scrollArea.classList.contains("bottom")){
      window.scrollBy(0, 10);
    }
    if(scrollArea.classList.contains("top")){
      window.scrollBy(0, -10);
    }
    if(scrollArea.classList.contains("left")){
      window.scrollBy(-10, 0);
    }
    if(scrollArea.classList.contains("right")){
      window.scrollBy(10, 0);
    }
  }

  startMouseInput(): void {
      
  }
  
  public startEyeInput(){
    var inside : boolean = false;
    this.interval = setInterval(() => {
      for(var i = 0; i < this.scrollAreas.length; i++){
        var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
        inside = this.eyesOnlyInput.areEyesInsideElement(el!);
        if (inside == true){
          this.scroll(el);
        }
      }
    }, 100)
  }


public startMix1Input(): void {
  document.body.addEventListener('keydown', this.bound_Mix1Input);
}

public bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
public Mix1Input(e : any){
  if(e.keyCode == 13){
    for(var i = 0; i < this.scrollAreas.length; i++){
      var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
      var inside : boolean = false;
      if(el){     
        inside = this.eyesOnlyInput.areEyesInsideElement(el);
        if (inside == true){ 
          this.scroll(el);
        }
      }
    }
  }
}

public mouseInput : boolean = false; //TODO: needed?


public startMix2Input(){
  this.eyesOnlyInput.activateMix2Input(this.sandbox, this.arrow, this.timeOutAfterMouseInput);
  var inside : boolean | undefined = false;
  this.interval = setInterval(() => {
    for(var i = 0; i < this.scrollAreas.length; i++){
      var el : HTMLElement = this.scrollAreas[i] as HTMLElement;
      inside = this.eyesOnlyInput.isInside(el, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
      if (inside == true){
        this.scroll(el);
      }
  }
  }, 100);
}

public target1Reached : boolean = false;
@ViewChild('target1', { static: true }) target1!: ElementRef;

public isHeadingInTargetArea(heading : HTMLElement): boolean{
  const targetArea = document.getElementById("target-area")
  var boundingBox = heading.getBoundingClientRect();
  var inside = this.eyesOnlyInput.isInside(targetArea!, undefined, boundingBox.top)
  if(heading == this.target1.nativeElement && inside){
    this.target1Reached = true;
  }
  return inside
}


public stopOtherInputs(){
  window.scrollTo(0,0);
  //end Eye Input
  clearInterval(this.interval);
  //end Mix1 click event
  document.body.removeEventListener('keydown', this.bound_Mix1Input);
  //MIX2
  this.eyesOnlyInput.stopMix2Input(this.sandbox, this.arrow);
}


}






    

