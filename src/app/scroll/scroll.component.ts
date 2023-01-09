import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Store } from '@ngrx/store';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
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

  public scrollAreas = document.getElementsByClassName("scroll-area");

  // calculations for target area(should be same height + position as content)
  protected pxToScrollIntoTargetArea = 70; 
  protected content = document.getElementById("content")
  protected contentTopPx = this.content!.getBoundingClientRect().top + this.pxToScrollIntoTargetArea;
  protected contentHeightPx = parseFloat(window.getComputedStyle(this.content!).getPropertyValue('height')) + 2 * parseFloat(window.getComputedStyle(this.content!).getPropertyValue('padding-top')) - 2 * this.pxToScrollIntoTargetArea;
  protected contentTop = this.contentTopPx.toString() + 'px'; 
  protected contentHeight = this.contentHeightPx.toString() + 'px'; 

  private interval_eye : any = null;
  private interval_mix2 : any = null;
  protected mix1ScrollInterval : any[] = [null,null,null,null]; 


  constructor(cdRef: ChangeDetectorRef, store : Store<AppState>, private eyeInputService : EyeInputService, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) {
    super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
   }

  private scroll(scrollArea : HTMLElement){
    const content = document.getElementById("content");
    if(content){
      if(scrollArea.classList.contains("bottom")){
        content.scrollBy(0, 30);
      }
      if(scrollArea.classList.contains("top")){
        content.scrollBy(0, -30);
      }
      if(scrollArea.classList.contains("left")){
        content.scrollBy(-30, 0);
      }
      if(scrollArea.classList.contains("right")){
        content.scrollBy(30, 0);
      }
      this.changeTargetReached();
    } 
  }

  protected startMouseInput(): void {
    const content = document.getElementById("content");
    content!.addEventListener("scroll", this.bound_changeTargetReached);
  }
  
  protected startEyeInput(){
    this.preventMouseScroll();
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


  protected startMix1Input(): void {
    this.preventMouseScroll();
    document.body.addEventListener('keydown', this.bound_Mix1Input);
    document.body.addEventListener('keyup', this.bound_removeMix1ScrollInterval);
  }

  private bound_removeMix1ScrollInterval = this.removeMix1ScrollInterval.bind(this);
  private removeMix1ScrollInterval(){
    this.newENTERPress = true;
    for(let i = 0; i < this.mix1ScrollInterval.length; i++){
      clearInterval(this.mix1ScrollInterval[i]); 
    }
  }

  private newENTERPress : boolean = true;
  private bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
  private Mix1Input(e : any){
    if(e.keyCode == 13 && this.newENTERPress){
      this.newENTERPress = false; 
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

  protected startMix2Input(){
    this.preventMouseScroll();
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
    setTimeout(() => {
      this.mix2loaded = true;
    }, 500)
    console.log(this.mix2loaded)
  }

  protected target1Reached : boolean = false;
  protected target2Reached : boolean = false;
  @ViewChild('target1', { static: true }) target1!: ElementRef;
  @ViewChild('target2', { static: true }) target2!: ElementRef;

  private isHeadingInTargetArea(heading : HTMLElement): boolean{
    const targetArea = document.getElementById("target-area")
    let headingBoundingBox = heading.getBoundingClientRect();
    let inside = this.eyeInputService.isInside(targetArea!, undefined, headingBoundingBox.bottom)
    return inside;
  }


  private bound_changeTargetReached = this.changeTargetReached.bind(this);
  private changeTargetReached(){
    let target1Inside = this.isHeadingInTargetArea(this.target1.nativeElement);
    let target2Inside = this.isHeadingInTargetArea(this.target2.nativeElement);
    if(target1Inside){
      this.target1Reached = true;
    }
    if(target2Inside && this.target1Reached){
      this.addSuccess();
    }
  }

  public addSuccess(aborted? : boolean){
    this.taskEvaluationService.endTask(aborted);
    if(aborted){
      this.target2Reached = false;
      this.target1Reached = false;
      this.randomizationService.nextRep();
    }
    else{ 
      this.target2Reached = true;
      this.stopAllInputs();
      setTimeout(() => {
        this.target2Reached = false;
        this.target1Reached = false;
        this.activateSelectedInputType();
        this.randomizationService.nextRep();
      }, 2000)
    }
    this.slideInSuccessBox()
  }

  //disable scroll
  private preventDefault(event : any){
    event.preventDefault();
  }

  private preventMouseScroll(){ 
    window.addEventListener('wheel', this.preventDefault, { passive: false })
  }

  private allowMouseScroll(){ 
    window.removeEventListener('wheel', this.preventDefault)
  }

  protected slideInSuccessBox(){
    var successBox = document.getElementById("successBox");
    setTimeout(() => {
      successBox!.style.opacity = "1";
      successBox!.style.animation = "0.5s linear slide-in";
    }, 800)
    setTimeout(() => {
      successBox!.style.opacity = "0";
      successBox!.style.opacity = "1000ms";
    }, 5000)
  }

  public stopAllInputs(){
    this.allowMouseScroll();
    const content = document.getElementById("content");
    console.log("stopAllInputs scroll component")
    content?.scrollTo(0,0);
    //mouse
    content!.removeEventListener("scroll", this.bound_changeTargetReached); 
    //end Eye Input
    clearInterval(this.interval_mix2);
    clearInterval(this.interval_eye);
    //end Mix1 click event
    document.body.removeEventListener('keydown', this.bound_Mix1Input);
    document.body.removeEventListener('keyup', this.removeMix1ScrollInterval);
    this.removeMix1ScrollInterval();
    this.newENTERPress = true;
    //MIX2
    this.mix2loaded = false;
    this.eyeInputService.stopMix2Input(window.document.body, this.arrow);
  }
}






    

