import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestInputMethodsComponent } from './test-input-methods.component';

describe('TestInputMethodsComponent', () => {
  let component: TestInputMethodsComponent;
  let fixture: ComponentFixture<TestInputMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestInputMethodsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestInputMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
