import { Component, EventEmitter, Output, OnInit, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil} from 'rxjs';
import { InputType } from '../enums/input-type';
import { AppState } from '../state/app.state';
import { selectInputType } from '../state/expConditions/expconditions.selector';

@Component({
  selector: 'app-popup-pointer-lock-stop',
  templateUrl: './popup-pointer-lock-stop.component.html',
  styleUrls: ['./popup-pointer-lock-stop.component.css']
})
export class PopupPointerLockStopComponent implements OnInit, OnDestroy {

  @Output() closeCallback = new EventEmitter();

  public selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  public selectedInputType : InputType = InputType.EYE; 
  public sandbox : HTMLElement | null = document.getElementById("experimentSandbox"); 
  public destroy$ : Subject<boolean> = new Subject<boolean>(); 

  constructor(protected store : Store<AppState>) { }

  public click(): void {
    this.closeCallback.emit();
  }

  ngOnInit(): void {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
  }

  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  public pointerLockedStopped() : boolean {
    if(this.selectedInputType == InputType.MIX2){
      return !(document.pointerLockElement === this.sandbox);
    }
    else{
      return false;
    }
  }

}
