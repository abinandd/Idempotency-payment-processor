import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-stack">
      <header class="page-header">
        <p class="eyebrow">Event stream</p>
        <h2>Operational timeline</h2>
        <p>Recent actions appear here as the lab runs, the bank mode changes, and the runtime updates.</p>
      </header>

      <section class="log-stream">
        <div class="panel-head">
          <div class="panel-title">
            <h3>Recent entries</h3>
            <p>Newer messages appear at the top of the feed.</p>
          </div>
          <span class="helper-chip"><i data-lucide="list"></i> {{ state.timeline().length }} events</span>
        </div>

        <div class="log-list">
          <div *ngFor="let item of state.timeline()" class="log-item">
            <span class="log-dot"></span>
            <div>
              <div class="text-mono">{{ item }}</div>
            </div>
          </div>

          <div *ngIf="state.timeline().length === 0" class="empty-state">
            <i data-lucide="activity"></i>
            <strong>No events captured yet</strong>
            <span>Interact with the lab or change the bank mode to populate this feed.</span>
          </div>
        </div>
      </section>
    </section>
  `
})
export class TimelineComponent {
  constructor(public state: PaymentStateService) {}
}
