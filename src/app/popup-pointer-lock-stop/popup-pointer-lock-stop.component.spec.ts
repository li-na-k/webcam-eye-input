import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupPointerLockStopComponent } from './popup-pointer-lock-stop.component';

describe('PopupPointerLockStopComponent', () => {
  let component: PopupPointerLockStopComponent;
  let fixture: ComponentFixture<PopupPointerLockStopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PopupPointerLockStopComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupPointerLockStopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
