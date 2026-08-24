import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="section-head">
        <h2>Event timeline</h2>
        <p>All notable changes are collected here in chronological order. New entries appear at the top.</p>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Event feed</h3>
            <p>New entries appear at the top.</p>
          </div>
          <span class="live-chip">{{ state.timeline().length }} items</span>
        </div>

        <div *ngIf="state.timeline().length > 0" class="log-feed">
          <div *ngFor="let item of state.timeline()" class="log-entry">
            <span class="log-dot"></span>
            <span class="log-text">{{ item }}</span>
          </div>
        </div>

        <div *ngIf="state.timeline().length === 0" class="empty-state">
          <i data-lucide="activity" style="width:30px;height:30px;"></i>
          <strong>No activity yet</strong>
          <span>Run the lab or change bank modes to add entries to the log.</span>
        </div>
      </div>
    </div>
  `
})
export class TimelineComponent {
  constructor(public state: PaymentStateService) {}
}
