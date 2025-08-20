import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DualScreenComponent } from './dual-screen.component';

describe('DualScreenComponent', () => {
  let component: DualScreenComponent;
  let fixture: ComponentFixture<DualScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DualScreenComponent]
    });
    fixture = TestBed.createComponent(DualScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
