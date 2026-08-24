import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
        <h2 class="text-gradient">Idempotency Lab</h2>
        <p>Simulate concurrent payment requests and observe how duplicate transactions are prevented.</p>
    </div>
    
    <div class="grid-2">
        <div class="card">
            <h3 class="card-title">Configuration</h3>
            <div class="form-group">
                <label>Amount (INR)</label>
                <div class="input-with-icon">
                    <i data-lucide="credit-card"></i>
                    <input type="number" class="input-dark" [value]="state.labAmount()" (change)="state.labAmount.set($any($event.target).value)">
                </div>
            </div>
            <div class="form-group">
                <label>Concurrent Requests</label>
                <div class="input-with-icon">
                    <i data-lucide="shuffle"></i>
                    <input type="number" class="input-dark" [value]="state.labRequestCount()" (change)="state.labRequestCount.set($any($event.target).value)">
                </div>
            </div>
            
            <button class="btn btn-primary mt-4" (click)="state.runLab()" [disabled]="state.isProcessing()">
                <i data-lucide="zap" [class.spinning]="state.isProcessing()"></i> 
                {{ state.isProcessing() ? 'PROCESSING...' : 'SEND IDENTICAL REQUESTS' }}
            </button>
        </div>
        
        <div class="card">
            <h3 class="card-title">Live Visualization</h3>
            <div class="req-list">
                <div *ngFor="let r of state.labRequests()" class="req-item" [ngClass]="r.status">
                    <div class="req-item-left">
                        <i *ngIf="r.status === 'success'" data-lucide="check-circle" class="text-success mr-2"></i>
                        <i *ngIf="r.status === 'conflict'" data-lucide="shield" class="text-warning mr-2"></i>
                        <i *ngIf="r.status === 'error'" data-lucide="x-circle" class="text-danger mr-2"></i>
                        <i *ngIf="r.status === 'pending'" data-lucide="clock" class="text-muted mr-2"></i>
                        <span class="text-mono font-bold">REQ-0{{ r.index }}</span>
                    </div>
                    <span class="badge" [ngClass]="r.status">{{ r.status | uppercase }}</span>
                </div>
                <div *ngIf="state.labRequests().length === 0" class="empty-state">
                    <i data-lucide="activity" class="mx-auto block mb-2 opacity-50 icon-large"></i>
                    Click send to begin simulation.
                </div>
            </div>
        </div>
    </div>
  `
})
export class LabComponent {
  constructor(public state: PaymentStateService) {}
}
