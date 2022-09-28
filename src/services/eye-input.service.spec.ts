import { TestBed } from '@angular/core/testing';

import { EyeInputService } from './eye-input.service';

describe('EyeInputService', () => {
  let service: EyeInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EyeInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
