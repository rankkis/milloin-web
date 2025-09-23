import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WashingMachineCardComponent, WashingMachine } from '../washing-machine-card/washing-machine-card.component';

@Component({
  selector: 'app-washing-machine-list',
  imports: [CommonModule, WashingMachineCardComponent],
  templateUrl: './washing-machine-list.component.html',
  styleUrl: './washing-machine-list.component.scss'
})
export class WashingMachineListComponent {
  washingMachines: WashingMachine[] = [
    {
      id: 'WM001',
      name: 'Washing Machine 1',
      status: 'available',
      location: 'Laundry Room A'
    },
    {
      id: 'WM002',
      name: 'Washing Machine 2',
      status: 'running',
      timeRemaining: 25,
      location: 'Laundry Room A'
    },
    {
      id: 'WM003',
      name: 'Washing Machine 3',
      status: 'finished',
      location: 'Laundry Room B'
    },
    {
      id: 'WM004',
      name: 'Washing Machine 4',
      status: 'maintenance',
      location: 'Laundry Room B'
    }
  ];

  getCountByStatus(status: string): number {
    return this.washingMachines.filter(machine => machine.status === status).length;
  }
}
