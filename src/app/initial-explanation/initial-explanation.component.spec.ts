import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialExplanationComponent } from './initial-explanation.component';

describe('InitialExplanationComponent', () => {
  let component: InitialExplanationComponent;
  let fixture: ComponentFixture<InitialExplanationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InitialExplanationComponent]
    });
    fixture = TestBed.createComponent(InitialExplanationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
