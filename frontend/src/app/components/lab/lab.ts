import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-stack">
      <header class="page-header">
        <p class="eyebrow">Concurrency lab</p>
        <h2>Duplicate request simulation</h2>
        <p>Send identical payment requests at the same time and observe how the idempotency key prevents extra bank calls.</p>
      </header>

      <div class="request-grid">
        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h3>Run settings</h3>
              <p>Shape the burst before sending it into the mock payment API.</p>
            </div>
            <span class="helper-chip"><i data-lucide="shield"></i> {{ state.bankMode() }} mode</span>
          </div>

          <div class="form-stack">
            <div class="field">
              <label for="amount">Amount (INR)</label>
              <div class="input-shell">
                <i data-lucide="credit-card" class="text-accent"></i>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  [value]="state.labAmount()"
                  (input)="setAmount($any($event.target).value)" />
              </div>
              <p class="field-hint">The lab uses one shared amount across every request in the burst.</p>
            </div>

            <div class="field">
              <label for="request-count">Concurrent requests</label>
              <div class="input-shell">
                <i data-lucide="shuffle" class="text-accent"></i>
                <input
                  id="request-count"
                  type="number"
                  min="1"
                  max="20"
                  [value]="state.labRequestCount()"
                  (input)="setCount($any($event.target).value)" />
              </div>
              <p class="field-hint">Higher values increase the chance of duplicate contention.</p>
            </div>

            <div class="button-row">
              <button class="button button-primary" type="button" (click)="state.runLab()" [disabled]="state.isProcessing()">
                <i data-lucide="zap"></i>
                {{ state.isProcessing() ? 'Processing burst' : 'Send duplicate burst' }}
              </button>
              <button class="button button-secondary" type="button" (click)="state.addTimeline('Lab controls inspected.')">
                <i data-lucide="activity"></i>
                Mark note
              </button>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h3>Live request stream</h3>
              <p>Each row shows the result of one concurrent request.</p>
            </div>
            <span class="helper-chip"><i data-lucide="list"></i> {{ state.labRequests().length }} tracked</span>
          </div>

          <div class="request-list">
            <div *ngFor="let request of state.labRequests()" class="request-item" [ngClass]="request.status">
              <div class="request-left">
                <i *ngIf="request.status === 'success'" data-lucide="check-circle" class="text-success"></i>
                <i *ngIf="request.status === 'conflict'" data-lucide="shield" class="text-warning"></i>
                <i *ngIf="request.status === 'error'" data-lucide="x-circle" class="text-danger"></i>
                <i *ngIf="request.status === 'pending'" data-lucide="clock" class="text-muted"></i>
                <div>
                  <strong>REQ-{{ request.index.toString().padStart(2, '0') }}</strong>
                  <div class="request-meta">
                    {{ request.status === 'success' ? 'Processed successfully' : request.status === 'conflict' ? 'Rejected as duplicate' : request.status === 'error' ? 'Unexpected error' : 'Waiting for a response' }}
                  </div>
                </div>
              </div>
              <span class="badge" [ngClass]="request.status">{{ request.status }}</span>
            </div>

            <div *ngIf="state.labRequests().length === 0" class="empty-state">
              <i data-lucide="activity"></i>
              <strong>No burst started yet</strong>
              <span>Choose a request count and launch the simulation.</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  `
})
export class LabComponent {
  constructor(public state: PaymentStateService) {}

  setAmount(value: string) {
    this.state.setLabAmount(Number(value));
  }

  setCount(value: string) {
    this.state.setLabRequestCount(Number(value));
  }
}
