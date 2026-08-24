import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="section-head">
        <h2>Duplicate request stress test</h2>
        <p>Configure a burst of identical requests, launch it, and inspect how idempotency keeps bank traffic under control.</p>
      </div>

      <div class="two-col">
        <!-- Settings panel -->
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3>Simulation settings</h3>
              <p>These controls shape the next test run.</p>
            </div>
            <span class="live-chip">
              <i data-lucide="shield" style="width:13px;height:13px;"></i>
              {{ state.bankMode() }}
            </span>
          </div>
          <div class="panel-body">
            <div class="form-group">
              <div class="field">
                <label for="amount">Amount (INR)</label>
                <div class="input-wrap">
                  <i data-lucide="credit-card" style="width:15px;height:15px;"></i>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    [value]="state.labAmount()"
                    (input)="setAmount($any($event.target).value)" />
                </div>
                <span class="field-hint">A single value reused across every request in the burst.</span>
              </div>

              <div class="field">
                <label for="request-count">Concurrent requests</label>
                <div class="input-wrap">
                  <i data-lucide="shuffle" style="width:15px;height:15px;"></i>
                  <input
                    id="request-count"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="e.g. 5"
                    [value]="state.labRequestCount()"
                    (input)="setCount($any($event.target).value)" />
                </div>
                <span class="field-hint">More requests create a louder race for the same key.</span>
              </div>

              <div class="btn-row">
                <button class="btn btn-primary" type="button" (click)="state.runLab()" [disabled]="state.isProcessing()">
                  <i data-lucide="zap" style="width:14px;height:14px;"></i>
                  {{ state.isProcessing() ? 'Running…' : 'Launch burst' }}
                </button>
                <button class="btn btn-secondary" type="button" (click)="state.addTimeline('Lab settings reviewed.')">
                  <i data-lucide="activity" style="width:14px;height:14px;"></i>
                  Add note
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Results panel -->
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3>Request results</h3>
              <p>Watch each request settle into success, conflict, or error.</p>
            </div>
            <span class="live-chip">{{ state.labRequests().length }} rows</span>
          </div>

          <div *ngIf="state.labRequests().length > 0">
            <div class="table-header">
              <span>Request</span>
              <span>Description</span>
              <span>Status</span>
            </div>
            <div *ngFor="let req of state.labRequests()" class="table-row" [ngClass]="req.status">
              <span class="req-id">REQ-{{ req.index.toString().padStart(2,'0') }}</span>
              <span class="req-desc">
                {{ req.status === 'success' ? 'Processed successfully'
                 : req.status === 'conflict' ? 'Blocked as duplicate'
                 : req.status === 'error' ? 'Unexpected error'
                 : 'Awaiting response' }}
              </span>
              <span class="badge" [ngClass]="req.status">{{ req.status }}</span>
            </div>
          </div>

          <div *ngIf="state.labRequests().length === 0" class="empty-state">
            <i data-lucide="activity" style="width:30px;height:30px;"></i>
            <strong>No requests launched yet</strong>
            <span>Tune the settings and start a burst to populate the results list.</span>
          </div>
        </div>
      </div>
    </div>
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
