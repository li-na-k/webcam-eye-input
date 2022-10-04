import { TestBed } from '@angular/core/testing';

import { RandomizationService } from './randomization.service';

describe('RandomizationService', () => {
  let service: RandomizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RandomizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
