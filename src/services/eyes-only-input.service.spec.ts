import { TestBed } from '@angular/core/testing';

import { EyesOnlyInputService } from './eyes-only-input.service';

describe('EyesOnlyInputService', () => {
  let service: EyesOnlyInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EyesOnlyInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
