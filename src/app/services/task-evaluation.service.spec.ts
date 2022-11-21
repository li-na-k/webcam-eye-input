import { TestBed } from '@angular/core/testing';

import { TaskEvaluationService } from './task-evaluation.service';

describe('TaskEvaluationService', () => {
  let service: TaskEvaluationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskEvaluationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
