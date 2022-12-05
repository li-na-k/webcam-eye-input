import { Component, EventEmitter, Output, OnInit, OnDestroy, AfterViewChecked, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil} from 'rxjs';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';

@Component({
  selector: 'app-popup-pointer-lock-stop',
  templateUrl: './popup-pointer-lock-stop.component.html',
  styleUrls: ['./popup-pointer-lock-stop.component.css']
})
export class PopupPointerLockStopComponent implements OnInit, OnDestroy, AfterViewInit {

  @Output() startMix2 = new EventEmitter();
  @Output() addSuccess = new EventEmitter();

  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE; 
  public sandbox : HTMLElement | null = document.getElementById("experimentSandbox"); 
  public arrow : HTMLElement | null = document.getElementById("arrow"); 
  public destroy$ : Subject<boolean> = new Subject<boolean>(); 
  public showPopup = true;

  constructor(protected store : Store<AppState>, protected eyeInputService : EyeInputService) { }

  public enablePointerLock(): void {
    this.startMix2.emit();
    this.showPopup = false;
  }

  public skipTask(): void{
    this.startMix2.emit(); 
    this.addSuccess.emit();
    this.showPopup = false;
  }

  ngOnInit(): void {
    //this.addKeyDownListener(); 
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
  }

  ngAfterViewInit(): void {
    this.eyeInputService.stopMix2Input(this.sandbox, this.arrow);
    this.eyeInputService.stopMix2Input(window.document.body, this.arrow); 
  }

  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
    document.body.removeEventListener('keydown', this.bound_popupIfEsc);
  }

  closeAndStopMix2() : void{
    this.showPopup = false;
    this.eyeInputService.stopMix2Input(this.sandbox, this.arrow)
    this.eyeInputService.stopMix2Input(window.document.body, this.arrow);
  }

  
  // protected stopped = false;
  public addKeyDownListener(){
    //if(this.selectedInputType == InputType.MIX2){
      console.log("addKeyDownListener MIX2")
      document.body.addEventListener('keydown', this.bound_popupIfEsc); 
    //}
  }

  public bound_popupIfEsc = this.popupIfEsc.bind(this); //otherwise function cannot be removed later with removeClickEvent
  public popupIfEsc(e : any){
    console.log(e.keyCode)
    if(e.keyCode == 27 || e.key === "Escape" || e.key === "Esc"){
      this.showPopup = true;
    }
  }

}
