import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { PIPELINE_STEPS, STAT_CARDS } from '../../utils/ui-data';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <!-- Section heading -->
      <div class="section-head">
        <h2>Live payment telemetry</h2>
        <p>Watch the demo summarize request volume, successful commits, bank calls, and duplicate suppression in one place.</p>
      </div>

      <!-- Stat cards -->
      <div class="stat-grid">
        <div *ngFor="let card of statCards" class="stat-card">
          <div class="stat-top">
            <div class="stat-icon-wrap">
              <i [attr.data-lucide]="card.icon" style="width:16px;height:16px;"></i>
            </div>
            <span class="stat-label-text">{{ card.label }}</span>
          </div>
          <div class="stat-value">{{ getStatValue(card.id) }}</div>
          <div class="stat-desc">{{ card.description }}</div>
        </div>
      </div>

      <!-- Processing pipeline -->
      <div class="panel">
        <div class="panel-head">
          <div>
            <h3>Processing pipeline</h3>
            <p>Each request follows the same protected path before reaching the bank.</p>
          </div>
          <span class="live-chip">
            <i data-lucide="activity" style="width:13px;height:13px;"></i>
            Live flow
          </span>
        </div>
        <div class="pipeline">
          <div *ngFor="let step of pipelineSteps; let i = index" class="pipeline-step">
            <div class="step-num-badge">{{ i + 1 }}</div>
            <h4>{{ step.label }}</h4>
            <p>{{ step.description }}</p>
          </div>
        </div>
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
