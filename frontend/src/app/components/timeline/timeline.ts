import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container>

      <div class="section-head" #headEl>
        <h2>Event Timeline</h2>
        <p>A live feed of all notable events. Most recent first.</p>
      </div>

      <div class="panel" #panelEl>
        <div class="panel-head">
          <h3>Event Feed</h3>
          <span class="live-chip">{{ state.timeline().length }} events</span>
        </div>

        <div *ngIf="state.timeline().length > 0" class="log-feed">
          <div *ngFor="let item of state.timeline()" class="log-entry">
            <span class="log-dot"></span>
            <span class="log-text">{{ item }}</span>
          </div>
        </div>

        <div *ngIf="state.timeline().length === 0" class="empty-state">
          <strong>No events yet</strong>
          <span>Run the lab or switch bank modes to generate events.</span>
        </div>
      </div>

    </div>
  `
})
export class TimelineComponent implements AfterViewInit {
  @ViewChild('headEl')  headEl!: ElementRef<HTMLElement>;
  @ViewChild('panelEl') panelEl!: ElementRef<HTMLElement>;

  constructor(public state: PaymentStateService, private anim: AnimationService) {}

  ngAfterViewInit() {
    this.anim.fadeUp(this.headEl.nativeElement, 0);
    this.anim.fadeUp(this.panelEl.nativeElement, 0.12);
  }
}
