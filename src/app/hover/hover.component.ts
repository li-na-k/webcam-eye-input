import { Component, OnDestroy, OnInit } from '@angular/core';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';


@Component({
  selector: 'app-hover',
  templateUrl: './hover.component.html',
  styleUrls: ['./hover.component.css']
})
export class HoverComponent implements OnInit, OnDestroy {

  public interval : any;
  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE;
  public destroy$ : Subject<boolean> = new Subject<boolean>(); //for unsubscribing Observables

  constructor(private store : Store<AppState>, private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
    this.activateSelectedInputType();

  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
    this.destroy$.next(true);
    this.destroy$.complete();
}

public checkEyeInput(){
  var el = document.getElementById("recthover");
  var inside : boolean | undefined = false;
  this.interval = setInterval(() => {
    if(el){
      inside = this.eyesOnlyInput.checkIfInsideElement(el);
    }
    if (inside == true && el){
      el.style.backgroundColor = "var(--apricot)";
    }
    else if(inside == false && el){
      el.style.backgroundColor = "var(--blue)";
    }
  }, 100);
}

public binded_startMix1Input = this.startMix1Input.bind(this); //otherwise function cannot be removed later with removeClickEvent

public startMix1Input(e : any){
  if(e.keyCode == 13){
    var el = document.getElementById("recthover");
    var inside : boolean = false;
    if(el){    
      console.log("clicked");
      inside = this.eyesOnlyInput.checkIfInsideElement(el);
      if (inside == true){ 
        el.style.backgroundColor = "var(--apricot)";
      }
      else if(inside == false){
        el.style.backgroundColor = "var(--blue)";
      }
    }
  }
}
//TODO: after hover, switch to blue again


public startMouseInput(){
  document.getElementById("recthover")!.style.backgroundColor = "var(--apricot)"
}

public startMix2Input(){
  const all = document.getElementById("experimentSandbox");
  all!.style.cursor = 'none';
  all!.addEventListener('mousemove', this.moveArrowWithMouse);
  const arrow = document.getElementById("arrow");
  arrow!.style.left = "10px";
  arrow!.style.top = "10px";
}

public moveArrowWithMouse(e : any){
  const all = document.getElementById("experimentSandbox");
  all!.removeEventListener('mousemove', this.moveArrowWithMouse);
  const arrow = document.getElementById("arrow");
  arrow!.style.visibility = "visible";
  var x = e.movementX;
  var y = e.movementY;
  var currentx = arrow!.style.left;
  var currenty = arrow!.style.top;
  var newx = parseInt(currentx, 10) + x;
  var newy = parseInt(currenty, 10) + y;
  arrow!.style.left = newx + "px";
  arrow!.style.top = newy + "px";
  console.log(arrow!.style.left);

  // console.log(arrow?.style.left);
  // console.log(e.clientX);
  // arrow!.style.left = e.clientX + "px";
  // arrow!.style.top = e.clientY + "px";
}

public stopOtherInputs(){
  var el = document.getElementById("recthover");
  el!.style.backgroundColor = "var(--blue)";
  //end Eye Input
  clearInterval(this.interval);
  //end Mix1 click event
  //window.removeEventListener('click', this.binded_startMix1Input)
  document.body.removeEventListener('keydown', this.binded_startMix1Input); 
  document.getElementById("recthover")?.removeEventListener('hover', this.startMouseInput);
  //MIX2
  const all = document.getElementById("experimentSandbox");
  all!.removeEventListener('mousemove', this.moveArrowWithMouse);
}

public activateSelectedInputType(){
  if(this.selectedInputType == InputType.EYE){
    this.stopOtherInputs();
    this.checkEyeInput();
  }
  if(this.selectedInputType == InputType.MOUSE){
    this.stopOtherInputs();
    document.getElementById("recthover")?.addEventListener('hover', this.startMouseInput);
  }
  if(this.selectedInputType == InputType.MIX1){
    this.stopOtherInputs();
    //window.addEventListener('click', this.binded_startMix1Input);
    document.body.addEventListener('keydown', this.binded_startMix1Input); 
  }
  if(this.selectedInputType == InputType.MIX2){
    this.stopOtherInputs();
    console.log("mix2")
    this.startMix2Input();
    //TODO
  }
}



}


