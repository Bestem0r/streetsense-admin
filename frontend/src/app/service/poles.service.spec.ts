import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PolesService } from './poles.service';

describe('PolesService', () => {
  let service: PolesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    service = TestBed.inject(PolesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
