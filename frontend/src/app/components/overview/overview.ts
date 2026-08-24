import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { PIPELINE_STEPS, STAT_CARDS } from '../../utils/ui-data';

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
      <div *ngFor="let card of statCards" class="card stat-card" [ngClass]="card.cardClass">
        <div class="stat-header">
            <div class="stat-label">{{ card.label }}</div>
            <i [attr.data-lucide]="card.icon" [class]="card.iconClass"></i>
        </div>
        <div class="stat-value text-mono">
            {{ getStatValue(card.id) }}
        </div>
      </div>
    </div>

    <div class="card mt-4">
        <h3 class="card-title">Live Processing Pipeline</h3>
        <div class="pipeline-viz">
            <ng-container *ngFor="let step of pipelineSteps; let i = index">
              <div class="pipe-node">
                  <i [attr.data-lucide]="step.icon" class="mb-2 block mx-auto" [ngClass]="step.colorClass"></i>
                  <span [innerHTML]="step.label"></span>
              </div>
              <div *ngIf="i < pipelineSteps.length - 1" class="pipe-line"></div>
            </ng-container>
        </div>
    </div>
  `
})
export class OverviewComponent {
  pipelineSteps = PIPELINE_STEPS;
  statCards = STAT_CARDS;

  constructor(public state: PaymentStateService) {}

  getStatValue(id: string): number {
    const stats = this.state.stats();
    return (stats as any)[id] || 0;
  }
}
