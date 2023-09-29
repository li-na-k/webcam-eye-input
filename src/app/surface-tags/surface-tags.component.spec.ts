import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurfaceTagsComponent } from './surface-tags.component';

describe('SurfaceTagsComponent', () => {
  let component: SurfaceTagsComponent;
  let fixture: ComponentFixture<SurfaceTagsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SurfaceTagsComponent]
    });
    fixture = TestBed.createComponent(SurfaceTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
