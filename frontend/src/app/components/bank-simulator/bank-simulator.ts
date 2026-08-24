import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-bank-simulator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
        <h2 class="text-gradient">Bank Simulator</h2>
        <p>Control how the simulated banking provider responds.</p>
    </div>
    
    <div class="grid-3">
        <div class="card mode-card" (click)="state.handleSetBankMode('SUCCESS')" [class.active]="state.bankMode() === 'SUCCESS'">
            <div class="mode-icon text-success"><i data-lucide="check-circle"></i></div>
            <h3>SUCCESS</h3>
            <p>Bank approves the transaction normally.</p>
        </div>
        <div class="card mode-card" (click)="state.handleSetBankMode('FAILURE')" [class.active]="state.bankMode() === 'FAILURE'">
            <div class="mode-icon text-danger"><i data-lucide="x-circle"></i></div>
            <h3>FAILURE</h3>
            <p>Bank rejects the transaction.</p>
        </div>
        <div class="card mode-card" (click)="state.handleSetBankMode('TIMEOUT')" [class.active]="state.bankMode() === 'TIMEOUT'">
            <div class="mode-icon text-warning"><i data-lucide="clock"></i></div>
            <h3>TIMEOUT</h3>
            <p>Bank does not respond. Status unknown.</p>
        </div>
    </div>
  `
})
export class BankSimulatorComponent {
  constructor(public state: PaymentStateService) {}
}
