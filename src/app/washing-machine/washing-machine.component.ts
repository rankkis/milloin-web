import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-washing-machine',
  imports: [SharedModule],
  templateUrl: './washing-machine.component.html',
  styleUrl: './washing-machine.component.scss'
})
export class WashingMachineComponent {}