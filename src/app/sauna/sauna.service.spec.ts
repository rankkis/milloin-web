import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { SaunaService } from './sauna.service';

describe('SaunaService', () => {
  let service: SaunaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SaunaService, provideHttpClient(withXhr())],
    });
    service = TestBed.inject(SaunaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
