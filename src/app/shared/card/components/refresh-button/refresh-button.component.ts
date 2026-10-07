import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-refresh-button',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './refresh-button.component.html',
  styleUrl: './refresh-button.component.scss'
})
export class RefreshButtonComponent {
  @Input() testId = 'refresh-button';
  @Input() ariaLabel = 'Refresh data';
  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}
