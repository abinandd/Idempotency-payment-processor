import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
        <h2 class="text-gradient">Payment Processing</h2>
        <p>Real-time idempotency and transaction monitoring</p>
    </div>
    
    <div class="grid-4">
      <div class="card stat-card">
        <div class="stat-header">
            <div class="stat-label">Total Requests</div>
            <i data-lucide="activity" class="text-muted"></i>
        </div>
        <div class="stat-value text-mono">{{ state.stats().totalRequests }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-header">
            <div class="stat-label">Actual Bank Calls</div>
            <i data-lucide="landmark" class="text-muted"></i>
        </div>
        <div class="stat-value text-mono">{{ state.stats().bankCalls }}</div>
      </div>
      <div class="card stat-card success-card">
        <div class="stat-header">
            <div class="stat-label">Successful Payments</div>
            <i data-lucide="check-circle" class="text-success"></i>
        </div>
        <div class="stat-value text-mono">{{ state.stats().successfulPayments }}</div>
      </div>
      <div class="card stat-card safe-card">
        <div class="stat-header">
            <div class="stat-label">Duplicates Blocked</div>
            <i data-lucide="shield" class="text-accent"></i>
        </div>
        <div class="stat-value text-mono">{{ state.stats().duplicateRequests }}</div>
      </div>
    </div>

    <div class="card mt-4">
        <h3 class="card-title">Live Processing Pipeline</h3>
        <div class="pipeline-viz">
            <div class="pipe-node"><i data-lucide="send" class="mb-2 block mx-auto text-accent"></i>Request<br>Received</div>
            <div class="pipe-line"></div>
            <div class="pipe-node"><i data-lucide="shield" class="mb-2 block mx-auto text-accent"></i>Idempotency<br>Check</div>
            <div class="pipe-line"></div>
            <div class="pipe-node"><i data-lucide="database" class="mb-2 block mx-auto text-danger"></i>Redis<br>Lock</div>
            <div class="pipe-line"></div>
            <div class="pipe-node"><i data-lucide="landmark" class="mb-2 block mx-auto text-warning"></i>Bank<br>Processing</div>
            <div class="pipe-line"></div>
            <div class="pipe-node"><i data-lucide="database" class="mb-2 block mx-auto text-success"></i>Database<br>Commit</div>
        </div>
    </div>
  `
})
export class OverviewComponent {
  constructor(public state: PaymentStateService) {}
}
