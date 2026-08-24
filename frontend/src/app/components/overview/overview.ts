import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { PIPELINE_STEPS, STAT_CARDS } from '../../utils/ui-data';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-stack">
      <header class="page-header">
        <p class="eyebrow">System overview</p>
        <h2>Live payment telemetry</h2>
        <p>Watch the demo summarize request volume, successful commits, bank calls, and duplicate suppression in one place.</p>
      </header>

      <div class="metric-grid">
        <article *ngFor="let card of statCards" class="metric-card" [ngClass]="card.cardClass">
          <div class="metric-head">
            <div class="metric-label">{{ card.label }}</div>
            <i [attr.data-lucide]="card.icon" [class]="card.iconClass"></i>
          </div>
          <div class="metric-value text-mono">{{ getStatValue(card.id) }}</div>
          <p class="metric-caption">{{ card.description }}</p>
        </article>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <h3>Processing pipeline</h3>
            <p>Each request follows the same protected path before reaching the bank.</p>
          </div>
          <span class="helper-chip"><i data-lucide="activity"></i> Live flow</span>
        </div>

        <div class="pipeline-grid">
          <article *ngFor="let step of pipelineSteps" class="pipeline-step">
            <div class="step-icon">
              <i [attr.data-lucide]="step.icon" [ngClass]="step.colorClass"></i>
            </div>
            <strong>{{ step.label }}</strong>
            <p>{{ step.description }}</p>
          </article>
        </div>
      </section>
    </section>
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
