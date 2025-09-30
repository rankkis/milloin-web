import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChargeEvComponent } from './charge-ev.component';
import { SharedModule } from '../shared/shared.module';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ChargeEvComponent', () => {
  let component: ChargeEvComponent;
  let fixture: ComponentFixture<ChargeEvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChargeEvComponent],
      imports: [SharedModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChargeEvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
