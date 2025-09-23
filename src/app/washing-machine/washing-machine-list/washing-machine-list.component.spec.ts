import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WashingMachineListComponent } from './washing-machine-list.component';

describe('WashingMachineListComponent', () => {
  let component: WashingMachineListComponent;
  let fixture: ComponentFixture<WashingMachineListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WashingMachineListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WashingMachineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
