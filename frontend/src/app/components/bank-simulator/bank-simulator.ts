import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { BANK_MODES } from '../../utils/ui-data';

@Component({
  selector: 'app-bank-simulator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-stack">
      <header class="page-header">
        <p class="eyebrow">Provider controls</p>
        <h2>Bank simulator</h2>
        <p>Flip the mock provider between success, failure, and timeout to see how the payment flow and idempotency store react.</p>
      </header>

      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <h3>Response mode</h3>
            <p>The active mode changes the next bank response immediately.</p>
          </div>
          <span class="helper-chip"><i data-lucide="settings"></i> Active: {{ state.bankMode() }}</span>
        </div>

        <div class="mode-grid">
          <button
            *ngFor="let mode of bankModes"
            type="button"
            class="mode-card"
            [class.active]="state.bankMode() === mode.id"
            (click)="state.handleSetBankMode(mode.id)">
            <div class="mode-card-header">
              <div class="mode-copy">
                <strong>{{ mode.label }}</strong>
                <span>{{ mode.description }}</span>
              </div>
              <span class="mode-icon" [ngClass]="mode.colorClass">
                <i [attr.data-lucide]="mode.icon"></i>
              </span>
            </div>

            <div class="helper-chip" [ngClass]="mode.colorClass">
              <i data-lucide="activity"></i>
              Select {{ mode.label }}
            </div>
          </button>
        </div>
      </section>
    </section>
  `
})
export class BankSimulatorComponent {
  bankModes = BANK_MODES;

  constructor(public state: PaymentStateService) {}
}
