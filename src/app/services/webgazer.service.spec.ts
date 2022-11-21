import { TestBed } from '@angular/core/testing';

import { WebgazerService } from './webgazer.service';

describe('WebgazerService', () => {
  let service: WebgazerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebgazerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
