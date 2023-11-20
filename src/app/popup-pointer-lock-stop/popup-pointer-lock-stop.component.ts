import { Component, EventEmitter, Output, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil} from 'rxjs';
import { EyeInputService } from 'src/app/services/eye-input.service';
import { AppComponent } from '../app.component';
import { InputType } from '../enums/input-type';
import { RandomizationService } from '../services/randomization.service';
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

  protected selectedInputType$ : Observable<InputType> = this.store.select(selectInputType);
  protected selectedInputType : InputType = InputType.EYE; 
  protected arrow : HTMLElement | null = document.getElementById("arrow"); 
  private destroy$ : Subject<boolean> = new Subject<boolean>(); 
  protected showPopup = true;

  constructor(protected store : Store<AppState>, protected eyeInputService : EyeInputService, protected randomizationService : RandomizationService) { }

  protected enablePointerLock(): void {
    this.startMix2.emit();
    this.showPopup = false;
  }

  protected skipRep(): void{
    this.startMix2.emit(); 
    this.addSuccess.emit();
    this.showPopup = false;
  }

  ngOnInit(): void {
    this.selectedInputType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.selectedInputType = d);
  }

  ngAfterViewInit(): void {
    this.eyeInputService.stopMix2Input();
  }

  ngOnDestroy(){
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
