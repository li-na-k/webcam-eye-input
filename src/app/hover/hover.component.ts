import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
import { WebgazerService } from '../services/webgazer.service';
import { TaskEvaluationService } from '../services/task-evaluation.service';
import { RandomizationService } from '../services/randomization.service';

@Component({
  selector: 'app-hover',
  providers: [{ provide: BaseTasksComponent, useExisting: HoverComponent }],
  templateUrl: './hover.component.html',
  styleUrls: ['./hover.component.css']
})
export class HoverComponent extends BaseTasksComponent implements OnInit, OnDestroy {

  private hoverAreas : HTMLCollectionOf<HTMLElement> | null = null;

  private tooltipDuration : number = 2000;
  private tooltipTimers : any[] = [0,0,0,0];

  private intervals : any[] = [0,0,0,0]; //one for each click Area
  protected success: boolean = false;


  constructor(cdRef: ChangeDetectorRef, store : Store<AppState>, private eyeInputService : EyeInputService, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) { 
    super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
  }

  ngAfterViewInit(): void {
    this.hoverAreas = document.getElementsByClassName("hoverArea") as HTMLCollectionOf<HTMLElement>;
  }

  private showTooltip(element : HTMLElement){
    let tooltip = element.firstElementChild as HTMLElement;
    if(tooltip){
      this.checkIfError(tooltip);
      tooltip!.style.visibility = "visible"
      tooltip!.style.opacity = "1"
    }
    else{
      console.error("Tooltip element not found.")
    }
  }

  private checkIfError(tooltip : HTMLElement){
    setTimeout(() => {
      this.hideTooltip(tooltip.parentElement!); 
    }, 3000)
    if(tooltip.id != "success"){ //error
      this.taskEvaluationService.addError();
    }
    else{ //success
      this.addSuccess();
    }
  }

  public addSuccess(aborted? : boolean){
    this.taskEvaluationService.endTask(aborted);
    if(aborted){
      this.randomizationService.nextRep();
    }
    else{
      this.stopAllInputs(); 
      setTimeout(() => {
        this.success = true; // between-reps: Blank page because eyes should be in middle of screen again
        this.arrow!.style.left = "400px";
        this.arrow!.style.top = "400px";
        setTimeout(() => {
          this.success = false;
          this.activateSelectedInputType();
          this.randomizationService.nextRep();
        }, 5000)
      }, 3000);
    }
  }
  
  private hideTooltip(element : HTMLElement){
    let tooltip = element.firstElementChild as HTMLElement;
    if(tooltip){
      tooltip!.style.visibility = "hidden"
      tooltip!.style.opacity = "0"
    }
    else{
      console.log("Tooltip element not found.")
    }
  }
  
  private handler_show = (event : any) => this.showTooltip(event.target as HTMLElement);
  private handler_hide = (event : any) => this.hideTooltip(event.target as HTMLElement);
  protected startMouseInput(){
    for (let i = 0; i < this.hoverAreas!.length; i++){
      let currentHoverArea = this.hoverAreas![i];
      currentHoverArea.addEventListener('mouseover', this.handler_show);
      currentHoverArea.addEventListener('mouseleave', this.handler_hide);
    }
  }

  protected startEyeInput(){
    for (let i = 0; i < this.hoverAreas!.length; i++){
      let currentHoverArea = this.hoverAreas![i]; 
      let inside : boolean = false;
      let visible : boolean = false;
      this.intervals[i] = setInterval(() => {
        inside = this.eyeInputService.areEyesInsideElement(currentHoverArea);
        if (inside){
          visible = true;
          clearTimeout(this.tooltipTimers[i]) 
          this.changeApricot(currentHoverArea);
          this.showTooltip(currentHoverArea); //error evaluation
        }
        else { 
          this.changeBlue(currentHoverArea);
          if(visible){
            this.tooltipTimers[i] = setTimeout(() => {
              this.hideTooltip(currentHoverArea); 
              visible = false;
            }, this.tooltipDuration)
          }
        }
      }, 100);
    }
  }

private bound_Mix1Input = this.Mix1Input.bind(this); 
private Mix1Input(e : any){
  if(e.keyCode == 13){
    for (let i = 0; i < this.hoverAreas!.length; i++){
      let currentHoverArea = this.hoverAreas![i]; 
      let inside : boolean = false;
      if(currentHoverArea){   
        inside = this.eyeInputService.areEyesInsideElement(currentHoverArea);
        if (inside == true){
          this.changeApricot(currentHoverArea)
          this.showTooltip(currentHoverArea);
          this.tooltipTimers[i] = setTimeout(() => {
            this.hideTooltip(currentHoverArea); 
            this.changeBlue(currentHoverArea);
          }, this.tooltipDuration)
        }
      }
    }
  }
}

protected startMix1Input(): void {
  document.body.addEventListener('keydown', this.bound_Mix1Input);
}

protected startMix2Input(){
  console.log("start hover mix2")
  console.log(this.sandbox);
  this.eyeInputService.activateMix2Input(window.document.body, this.arrow, this.timeOutAfterMouseInput);
  setTimeout(() => {
    this.mix2loaded = true;
  }, 1500)
  for (let i = 0; i < this.hoverAreas!.length; i++){
    let currentHoverArea = this.hoverAreas![i]; 
    let inside : boolean | undefined = false;
    this.intervals[i] = setInterval(() => { 
      inside = this.eyeInputService.isInside(currentHoverArea, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
      if (inside == true){
        this.changeApricot(currentHoverArea);
        this.showTooltip(currentHoverArea);
      }
      else if(inside == false){
        this.changeBlue(currentHoverArea);
        this.hideTooltip(currentHoverArea);
      }
    }, 100);
  }
}

public stopAllInputs(){
  console.log("'stopAllInputs' called")
  for(let i of this.tooltipTimers){clearTimeout(i)};
  //MOUSE + hide tooltips from before
  for (let i = 0; i < this.hoverAreas!.length; i++){
    let currentHoverArea = this.hoverAreas![i];
    this.hideTooltip(currentHoverArea);
    currentHoverArea.removeEventListener('mouseover', this.handler_show);
    currentHoverArea.removeEventListener('mouseleave', this.handler_hide);
  }
  //EYE & MIX2 interval
  for(let i of this.intervals){clearInterval(i)}; 
  //MIX1
  document.body.removeEventListener('keydown', this.bound_Mix1Input); 
  //MIX2
  this.mix2loaded = false;
  this.eyeInputService.stopMix2Input(this.sandbox!, this.arrow!);
  
}

private changeApricot(el : HTMLElement){
  el.style.backgroundColor = "var(--apricot)";
}

private changeBlue(el : HTMLElement){
  el.style.backgroundColor = "var(--blue)";
}


}


