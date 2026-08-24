import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { BANK_MODES } from '../../utils/ui-data';

@Component({
  selector: 'app-bank-simulator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="section-head">
        <h2>Provider response modes</h2>
        <p>Switch the mock provider to simulate a happy path, a rejection, or a timeout and observe how the payment engine responds.</p>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Bank behaviour</h3>
            <p>The selected mode changes what the next payment attempt receives.</p>
          </div>
          <span class="live-chip">
            <i data-lucide="settings" style="width:13px;height:13px;"></i>
            Active: {{ state.bankMode() }}
          </span>
        </div>
        <div class="panel-body">
          <div class="mode-grid">
            <button
              *ngFor="let mode of bankModes"
              type="button"
              class="mode-card"
              [class.active]="state.bankMode() === mode.id"
              (click)="state.handleSetBankMode(mode.id)">
              <div class="mode-top">
                <div class="mode-icon">
                  <i [attr.data-lucide]="mode.icon" style="width:16px;height:16px;"></i>
                </div>
                <span class="active-indicator"></span>
              </div>
              <div class="mode-name">{{ mode.label }}</div>
              <div class="mode-desc">{{ mode.description }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BankSimulatorComponent {
  bankModes = BANK_MODES;

  constructor(public state: PaymentStateService) {}
}
