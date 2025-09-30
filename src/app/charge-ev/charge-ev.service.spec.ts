import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChargeEvService } from './charge-ev.service';

describe('ChargeEvService', () => {
  let service: ChargeEvService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChargeEvService,
        provideHttpClient()
      ]
    });
    service = TestBed.inject(ChargeEvService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
