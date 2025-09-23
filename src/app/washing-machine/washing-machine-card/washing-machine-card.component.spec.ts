import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WashingMachineCardComponent } from './washing-machine-card.component';

describe('WashingMachineCardComponent', () => {
  let component: WashingMachineCardComponent;
  let fixture: ComponentFixture<WashingMachineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WashingMachineCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WashingMachineCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
