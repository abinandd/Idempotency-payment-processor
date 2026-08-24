import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
        <h2 class="text-gradient">Event Timeline</h2>
        <p>Engineering-style event logs.</p>
    </div>
    
    <div class="card">
        <ul class="log-list">
            <li *ngFor="let t of state.timeline()" class="text-mono">
                <span class="text-accent mr-2">></span> {{ t }}
            </li>
            <li *ngIf="state.timeline().length === 0" class="text-mono opacity-50">
                <span class="text-muted mr-2">></span> No events recorded yet...
            </li>
        </ul>
    </div>
  `
})
export class TimelineComponent {
  constructor(public state: PaymentStateService) {}
}
