import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { SIDEBAR_NAV_ITEMS } from '../../utils/ui-data';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar-shell">
      <section class="sidebar-brand">
        <div class="brand-mark">
          <i data-lucide="shield"></i>
        </div>
        <div class="brand-copy">
          <p class="eyebrow">Realtime payments</p>
          <h2>Idempotency Lab</h2>
          <p>Design and inspect the payment retry path.</p>
        </div>
      </section>

      <nav class="sidebar-nav" aria-label="Primary navigation">
        <button
          *ngFor="let item of navItems"
          type="button"
          class="nav-button"
          [class.active]="state.activeTab() === item.id"
          (click)="state.setTab(item.id)">
          <span class="nav-icon"><i [attr.data-lucide]="item.icon"></i></span>
          <span class="nav-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </button>
      </nav>

      <section class="sidebar-footer">
        <div class="status-grid">
          <div class="status-row">
            <span><i data-lucide="server" class="text-success"></i> API</span>
            <strong>Online</strong>
          </div>
          <div class="status-row">
            <span><i data-lucide="database" class="text-accent"></i> Redis</span>
            <strong>Connected</strong>
          </div>
          <div class="status-row">
            <span><i data-lucide="database" class="text-accent"></i> Postgres</span>
            <strong>Connected</strong>
          </div>
        </div>

        <div style="margin-top: 1rem; display: flex; justify-content: space-between; gap: 0.75rem; align-items: center;">
          <span class="env-chip">Dev env</span>
          <span class="text-muted text-mono">v2.0</span>
        </div>
      </section>
    </aside>
  `
})
export class SidebarComponent {
  navItems = SIDEBAR_NAV_ITEMS;

  constructor(public state: PaymentStateService) {}
}
