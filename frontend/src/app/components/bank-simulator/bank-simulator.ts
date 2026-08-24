import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { BANK_MODES } from '../../utils/ui-data';

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
        <div 
          *ngFor="let mode of bankModes" 
          class="card mode-card" 
          (click)="state.handleSetBankMode(mode.id)" 
          [class.active]="state.bankMode() === mode.id">
            
            <div class="mode-icon" [ngClass]="mode.colorClass">
                <i [attr.data-lucide]="mode.icon"></i>
            </div>
            <h3>{{ mode.label }}</h3>
            <p>{{ mode.description }}</p>
        </div>
    </div>
  `
})
export class BankSimulatorComponent {
  bankModes = BANK_MODES;

  constructor(public state: PaymentStateService) {}
}
