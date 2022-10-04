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

  public taskElementID : string = "hover-task";
  public taskElement : HTMLElement | null = null;

  public tooltipDuration : number = 2000;
  public tooltip : HTMLElement | null = null;
  public tooltipTimer : any;


  constructor(cdRef: ChangeDetectorRef, store : Store<AppState>, private eyeInputService : EyeInputService, webgazerService : WebgazerService, taskEvaluationService : TaskEvaluationService, randomizationService : RandomizationService) { 
    super(store, cdRef, webgazerService, taskEvaluationService, randomizationService)
  }

  override ngAfterViewInit(): void {
    this.taskElement = document.getElementById(this.taskElementID)
  }

  public bound_showTooltip = this.showTooltip.bind(this);
  public showTooltip(){
    this.tooltip = document.getElementById("tooltip") //TODO use var if initialization is done inside function anyway
    if(this.tooltip){
      this.tooltip!.style.visibility = "visible"
      this.tooltip!.style.opacity = "1"
      this.randomizationService.nextRep();
    }
    else{
      console.error("Tooltip element not found.", this.tooltip)
    }
  }
  
  public bound_hideTooltip = this.hideTooltip.bind(this);
  public hideTooltip(){
    this.tooltip = document.getElementById("tooltip")
    if(this.tooltip){
      this.tooltip!.style.visibility = "hidden"
      this.tooltip!.style.opacity = "0"
    }
    else{
      console.log("Tooltip element not found.")
    }
  }
  
  public startMouseInput(){
    this.taskElement?.addEventListener('mouseover', this.bound_showTooltip)
    this.taskElement?.addEventListener('mouseleave', this.bound_hideTooltip) //TODO remove eventlistener later
  }

  public startEyeInput(){
    var inside : boolean | undefined = false;
    var visible : boolean = false;
    this.interval = setInterval(() => {
      inside = this.eyeInputService.areEyesInsideElement(this.taskElement!);
      if (inside){
        visible = true;
        clearTimeout(this.tooltipTimer)
        this.changeApricot(this.taskElement!);
        this.showTooltip();
      }
      else { 
        this.changeBlue(this.taskElement!);
        if(visible){
          this.tooltipTimer = setTimeout(() => {
            this.hideTooltip();
          }, this.tooltipDuration)
        }
        visible = false;
      }
    }, 100);
  }

public bound_Mix1Input = this.Mix1Input.bind(this);
public Mix1Input(e : any){
  if(e.keyCode == 13){
    var inside : boolean = false;
    if(this.taskElement){   
      inside = this.eyeInputService.areEyesInsideElement(this.taskElement);
      if (inside == true){
        this.changeApricot(this.taskElement!)
        this.showTooltip();
      }
      else if(inside == false){
        this.changeBlue(this.taskElement!)
        this.hideTooltip();
      }
    }
  }
}

public startMix1Input(): void {
  document.body.addEventListener('keydown', this.bound_Mix1Input);
}

public startMix2Input(){
  this.eyeInputService.activateMix2Input(this.sandbox, this.arrow, this.timeOutAfterMouseInput);
  //hover color effect
  var inside : boolean | undefined = false;
  this.interval = setInterval(() => {
    inside = this.eyeInputService.isInside(this.taskElement!, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
    if (inside == true){
      this.changeApricot(this.taskElement!);
      this.showTooltip()
    }
    else if(inside == false){
      this.changeBlue(this.taskElement!);
      this.hideTooltip();
    }
  }, 100);
}

public stopAllInputs(){
  this.hideTooltip()
  //EYE & MIX2 interval
  clearInterval(this.interval);
  //MOUSE
  this.taskElement?.removeEventListener('mouseover', this.showTooltip);
  this.taskElement?.removeEventListener('mouseleave', this.hideTooltip)
  clearTimeout(this.tooltipTimer)
  //MIX1
  document.body.removeEventListener('keydown', this.bound_Mix1Input); 
  //MIX2
  this.eyeInputService.stopMix2Input(this.sandbox, this.arrow);
}

public bound_changeElApricot = this.changeApricot.bind(this, this.taskElement!);
public changeApricot(el : HTMLElement){
  el.style.backgroundColor = "var(--apricot)";
}

public changeBlue(el : HTMLElement){
  el.style.backgroundColor = "var(--blue)";
}


}


