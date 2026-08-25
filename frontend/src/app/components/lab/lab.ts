import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container>

      <div class="section-head" #headEl>
        <h2>Stress Lab</h2>
        <p>Fire a burst of identical requests and watch duplicate suppression in action.</p>
      </div>

      <div class="two-col">

        <!-- Settings -->
        <div class="panel" #settingsPanel>
          <div class="panel-head">
            <div>
              <h3>Settings</h3>
              <p>Configure the next burst.</p>
            </div>
            <span class="live-chip">{{ state.bankMode() }}</span>
          </div>
          <div class="panel-body">
            <div class="form-group">

              <div class="field">
                <label for="amount">Amount (INR)</label>
                <div class="input-wrap">
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    [value]="state.labAmount()"
                    (input)="setAmount($any($event.target).value)" />
                </div>
                <span class="field-hint">Same value sent across all requests.</span>
              </div>

              <div class="field">
                <label for="request-count">Concurrent Requests</label>
                <div class="input-wrap">
                  <input
                    id="request-count"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="e.g. 5"
                    [value]="state.labRequestCount()"
                    (input)="setCount($any($event.target).value)" />
                </div>
                <span class="field-hint">Maximum 20 concurrent requests.</span>
              </div>

              <div class="btn-row">
                <button class="btn btn-primary" type="button" (click)="state.runLab()" [disabled]="state.isProcessing()">
                  {{ state.isProcessing() ? 'Running…' : 'Launch Burst' }}
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="panel" #resultsPanel>
          <div class="panel-head">
            <div>
              <h3>Results</h3>
              <p>Live outcome of each request.</p>
            </div>
            <span class="live-chip">{{ state.labRequests().length }} rows</span>
          </div>

          <div *ngIf="state.labRequests().length > 0">
            <div class="table-header">
              <span>ID</span>
              <span>Outcome</span>
              <span>Status</span>
            </div>
            <div *ngFor="let req of state.labRequests()" class="table-row" [ngClass]="req.status">
              <span class="req-id">REQ-{{ req.index.toString().padStart(2,'0') }}</span>
              <span class="req-desc">
                {{ req.status === 'success'  ? 'Processed'
                 : req.status === 'conflict' ? 'Duplicate blocked'
                 : req.status === 'error'    ? 'Error'
                 : 'Pending' }}
              </span>
              <span class="badge" [ngClass]="req.status">{{ req.status }}</span>
            </div>
          </div>

          <div *ngIf="state.labRequests().length === 0" class="empty-state">
            <strong>No requests yet</strong>
            <span>Launch a burst to see results.</span>
          </div>
        </div>

      </div>
    </div>
  `
})
export class LabComponent implements AfterViewInit {
  @ViewChild('headEl')      headEl!: ElementRef<HTMLElement>;
  @ViewChild('settingsPanel') settingsPanel!: ElementRef<HTMLElement>;
  @ViewChild('resultsPanel')  resultsPanel!: ElementRef<HTMLElement>;

  constructor(public state: PaymentStateService, private anim: AnimationService) {}

  ngAfterViewInit() {
    this.anim.fadeUp(this.headEl.nativeElement, 0);
    this.anim.staggerIn(
      [this.settingsPanel.nativeElement, this.resultsPanel.nativeElement],
      { y: 26, delay: 0.1, stagger: 0.1, duration: 0.48 }
    );
  }

  setAmount(value: string) { this.state.setLabAmount(Number(value)); }
  setCount(value: string)  { this.state.setLabRequestCount(Number(value)); }
}
