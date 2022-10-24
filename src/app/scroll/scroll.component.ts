import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Store } from '@ngrx/store';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { trigger, style, animate, transition } from '@angular/animations';
import { WebgazerService } from '../services/webgazer.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';
@Component({
  selector: 'app-scroll',
  providers: [{ provide: BaseTasksComponent, useExisting: ScrollComponent }],
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent extends BaseTasksComponent implements OnInit, OnDestroy {

  public taskElementID: string = "" //TODO: macht hier kein Sinn eigentlich
  public scrollAreas = document.getElementsByClassName("scroll-area");

  public interval_eye : any = null;
  public interval_mix2 : any = null;


  constructor(cdRef: ChangeDetectorRef, store : Store<AppState>, private eyeInputService : EyeInputService, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
    super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
   }

  public scroll(scrollArea : HTMLElement){
    if(scrollArea.classList.contains("bottom")){
      window.scrollBy(0, 30);
    }
    if(scrollArea.classList.contains("top")){
      window.scrollBy(0, -30);
    }
    if(scrollArea.classList.contains("left")){
      window.scrollBy(-30, 0);
    }
    if(scrollArea.classList.contains("right")){
      window.scrollBy(30, 0);
    }
    this.changeTargetReached();
  }

  startMouseInput(): void {
    window.addEventListener("scroll", this.bound_changeTargetReached);
  }
  
  public startEyeInput(){
    let inside : boolean = false;
    this.interval_eye = setInterval(() => {
      for(let i = 0; i < this.scrollAreas.length; i++){
        let el : HTMLElement = this.scrollAreas[i] as HTMLElement;
        inside = this.eyeInputService.areEyesInsideElement(el!);
        if (inside == true){
          this.scroll(el);
        }
      }
    }, 100)
  }


public startMix1Input(): void {
  document.body.addEventListener('keydown', this.bound_Mix1Input);
  document.body.addEventListener('keyup', this.removeMix1ScrollInterval);
}

protected mix1ScrollInterval : any[] = [null,null,null,null]; 
protected removeMix1ScrollInterval(){
  for(let i = 0; i < this.mix1ScrollInterval.length; i++){
    clearInterval(this.mix1ScrollInterval[i]); 
   }
}

public bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
public Mix1Input(e : any){
  if(e.keyCode == 13){
    for(let i = 0; i < this.scrollAreas.length; i++){
      let el : HTMLElement = this.scrollAreas[i] as HTMLElement;
      let inside : boolean = false;
      if(el){     
        inside = this.eyeInputService.areEyesInsideElement(el);
        if (inside == true){ 
          clearInterval(this.mix1ScrollInterval[i]);
          this.mix1ScrollInterval[i] = setInterval(() => {
            this.scroll(el);
          }, 100)
        }
      }
    }
  }
}

public mouseInput : boolean = false; //TODO: needed?

public mix2loaded = false;
public startMix2Input(){
  this.eyeInputService.activateMix2Input(window.document.body, this.arrow, this.timeOutAfterMouseInput);
  let inside : boolean | undefined = false;
  this.interval_mix2 = setInterval(() => {
    for(let i = 0; i < this.scrollAreas.length; i++){
      let el : HTMLElement = this.scrollAreas[i] as HTMLElement;
      inside = this.eyeInputService.isInside(el, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
      if (inside == true){
        this.scroll(el);
      }
    }
  }, 100);
  this.mix2loaded = true;
}

public target1Reached : boolean = false;
public target2Reached : boolean = false;
@ViewChild('target1', { static: true }) target1!: ElementRef;
@ViewChild('target2', { static: true }) target2!: ElementRef;

public isHeadingInTargetArea(heading : HTMLElement): boolean{
  const targetArea = document.getElementById("target-area")
  let headingBoundingBox = heading.getBoundingClientRect();
  let inside = this.eyeInputService.isInside(targetArea!, undefined, headingBoundingBox.top)
  return inside;
}


public bound_changeTargetReached = this.changeTargetReached.bind(this);
public changeTargetReached(){
  let target1Inside = this.isHeadingInTargetArea(this.target1.nativeElement);
  let target2Inside = this.isHeadingInTargetArea(this.target2.nativeElement);
  if(target1Inside){
    this.target1Reached = true;
  }
  if(target2Inside && this.target1Reached){
    this.taskEvaluationService.endTask();
    this.target2Reached = true;
    this.stopAllInputs();
    //TODO: add waiting for next rep popup?
    setTimeout(() => {
      this.target2Reached = false;
      this.target1Reached = false;
      this.activateSelectedInputType();
      this.randomizationService.nextRep();
    }, 2000);
  }
}

public stopAllInputs(){
  console.log("stopAllInputs scroll component")
  // this.target2Reached = false;
  // this.target1Reached = false;
  //mouse
  window.removeEventListener("scroll", this.bound_changeTargetReached); 
  //end Eye Input
  clearInterval(this.interval_mix2);
  clearInterval(this.interval_eye);
  //end Mix1 click event
  document.body.removeEventListener('keydown', this.bound_Mix1Input);
  document.body.removeEventListener('keyup', this.removeMix1ScrollInterval);
  this.removeMix1ScrollInterval();
  //MIX2
  this.eyeInputService.stopMix2Input(window.document.body, this.arrow);
  this.mix2loaded = false;
}


}






    

