import { Component, OnDestroy, OnInit } from '@angular/core';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { BaseTasksComponent } from '../base-tasks/base-tasks.component';
@Component({
  selector: 'app-click',
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent extends BaseTasksComponent implements OnInit, OnDestroy  {

  public readonly dwellTime = 1000;
  public taskElementID : string = "click-task";

  public moveArrowInterval : any;

  constructor(private eyesOnlyInput : EyesOnlyInputService, store : Store<AppState>) {
   super(store)
  }

  public startEyeInput(){
    var wentInsideAt : number|null = null; 
    var inside : boolean = false;
    this.interval = setInterval(() => {
      if(this.taskElement){
        inside = this.eyesOnlyInput.areEyesInsideElement(this.taskElement);
        if (inside == true){
          if (!wentInsideAt) {
            wentInsideAt = Date.now()
          }
          else if (wentInsideAt + this.dwellTime < Date.now()) {
            this.taskElement.style.backgroundColor = "var(--apricot)";
          }
        }
        else if(inside == false){
          wentInsideAt = null;
          this.taskElement.style.backgroundColor = "var(--blue)";
        }
      }
    }, 100);
  }


  public startMix1Input(){
    document.body.addEventListener('keydown', this.bound_Mix1Input); 
  }

  public bound_Mix1Input = this.Mix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent
  public Mix1Input(e : any){
    if(e.keyCode == 13){
      var inside : boolean = false;
      if(this.taskElement){    
        inside = this.eyesOnlyInput.areEyesInsideElement(this.taskElement);
        if (inside == true){ 
          this.taskElement.style.backgroundColor = "var(--apricot)";
        }
        else if(inside == false){
          this.taskElement.style.backgroundColor = "var(--blue)";
        }
      }
    }
  }

  public startMouseInput(){
    this.taskElement?.addEventListener('click', this.bound_changeElApricot)
  }

  // public mouseInput : boolean = false;
  // public timeOutAfterMouseInput : any;
  // public arrow : HTMLElement | null = null;
  // public sandbox = document.getElementById("experimentSandbox");

  public startMix2Input(){
    this.eyesOnlyInput.activateMix2Input(this.sandbox, this.arrow, this.timeOutAfterMouseInput);
    //Click color effect
    document.addEventListener('click', this.bound_clickEffect); 
  }


  public bound_clickEffect = this.clickEffect.bind(this); 
  public clickEffect(){
    var inside : boolean | undefined = false;
    inside = this.eyesOnlyInput.isInside(this.taskElement!, parseInt(this.arrow!.style.left, 10), parseInt(this.arrow!.style.top, 10));
    if (inside){
      this.taskElement!.style.backgroundColor = "var(--apricot)";
    }
    else if(!inside){
      this.taskElement!.style.backgroundColor = "var(--blue)";
    }
  }

  public stopOtherInputs(){
    this.taskElement!.style.backgroundColor = "var(--blue)"; //TODO: Use function from base class
    //end Eye Input
    clearInterval(this.interval);
    //end Mix1 click event
    //window.removeEventListener('click', this.bound_startMix1Input)
    document.body.removeEventListener('keydown', this.bound_Mix1Input); 
    //remove click event MOUSE input
    document.getElementById("rect")?.removeEventListener('click', this.bound_changeElApricot);
    //MIX2
    this.eyesOnlyInput.stopMix2Input(this.sandbox, this.arrow);
  }

}
