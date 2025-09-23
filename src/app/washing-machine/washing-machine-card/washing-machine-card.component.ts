import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WashingMachine {
  id: string;
  name: string;
  status: 'available' | 'running' | 'finished' | 'maintenance';
  timeRemaining?: number; // minutes
  location: string;
}

@Component({
  selector: 'app-washing-machine-card',
  imports: [CommonModule],
  templateUrl: './washing-machine-card.component.html',
  styleUrl: './washing-machine-card.component.scss'
})
export class WashingMachineCardComponent {
  @Input() washingMachine: WashingMachine = {
    id: '1',
    name: 'Washing Machine 1',
    status: 'available',
    location: 'Laundry Room A'
  };

  getStatusColor(): string {
    switch (this.washingMachine.status) {
      case 'available':
        return 'success';
      case 'running':
        return 'warning';
      case 'finished':
        return 'info';
      case 'maintenance':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusText(): string {
    switch (this.washingMachine.status) {
      case 'available':
        return 'Available';
      case 'running':
        return `Running (${this.washingMachine.timeRemaining} min left)`;
      case 'finished':
        return 'Finished';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  }
}
