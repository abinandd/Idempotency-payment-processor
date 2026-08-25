import { Component, AfterViewInit, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { AnimationService } from '../../services/animation.service';
import { STAT_CARDS } from '../../utils/ui-data';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container>

      <div class="section-head" #headEl>
        <h2>Live Payment Telemetry</h2>
        <p>Request volume, successful commits, bank calls, and duplicate suppression — all in one place.</p>
      </div>

      <div class="stat-grid">
        <div *ngFor="let card of statCards" class="stat-card" #statCard>
          <span class="stat-label-text">{{ card.label }}</span>
          <div class="stat-value">{{ getStatValue(card.id) }}</div>
          <div class="stat-desc">{{ card.description }}</div>
        </div>
      </div>

    </div>
  `
})
export class OverviewComponent implements AfterViewInit {
  statCards = STAT_CARDS;

  @ViewChild('headEl')  headEl!: ElementRef<HTMLElement>;
  @ViewChildren('statCard') statCardEls!: QueryList<ElementRef<HTMLElement>>;

  constructor(public state: PaymentStateService, private anim: AnimationService) {}

  ngAfterViewInit() {
    this.anim.fadeUp(this.headEl.nativeElement, 0);
    this.anim.staggerIn(
      this.statCardEls.map(r => r.nativeElement),
      { y: 24, delay: 0.1, stagger: 0.09, duration: 0.45 }
    );
  }

  getStatValue(id: string): number {
    const stats = this.state.stats();
    return (stats as any)[id] || 0;
  }
}
