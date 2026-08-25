import { Component, AfterViewInit, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { AnimationService } from '../../services/animation.service';
import { BANK_MODES } from '../../utils/ui-data';

@Component({
  selector: 'app-bank-simulator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container>

      <div class="section-head" #headEl>
        <h2>Bank Simulator</h2>
        <p>Switch the provider mode to observe how the payment engine responds.</p>
      </div>

      <div class="panel" #panelEl>
        <div class="panel-head">
          <div>
            <h3>Provider Mode</h3>
            <p>Select a behaviour for the next payment attempt.</p>
          </div>
          <span class="live-chip">Active: {{ state.bankMode() }}</span>
        </div>
        <div class="panel-body">
          <div class="mode-grid">
            <button
              *ngFor="let mode of bankModes"
              type="button"
              class="mode-card"
              [class.active]="state.bankMode() === mode.id"
              (click)="state.handleSetBankMode(mode.id)"
              #modeCard>
              <div class="active-indicator"></div>
              <div class="mode-name">{{ mode.label }}</div>
              <div class="mode-desc">{{ mode.description }}</div>
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class BankSimulatorComponent implements AfterViewInit {
  bankModes = BANK_MODES;

  @ViewChild('headEl')  headEl!: ElementRef<HTMLElement>;
  @ViewChild('panelEl') panelEl!: ElementRef<HTMLElement>;
  @ViewChildren('modeCard') modeCards!: QueryList<ElementRef<HTMLElement>>;

  constructor(public state: PaymentStateService, private anim: AnimationService) {}

  ngAfterViewInit() {
    this.anim.fadeUp(this.headEl.nativeElement, 0);
    this.anim.fadeUp(this.panelEl.nativeElement, 0.1);
    setTimeout(() => {
      this.anim.staggerIn(
        this.modeCards.map(c => c.nativeElement),
        { y: 20, delay: 0.2, stagger: 0.1, duration: 0.42 }
      );
    }, 50);
  }
}
