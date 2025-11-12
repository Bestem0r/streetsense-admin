import { TestBed } from '@angular/core/testing';

import { PolesService } from './poles.service';

describe('PolesService', () => {
  let service: PolesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
