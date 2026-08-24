import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { SIDEBAR_NAV_ITEMS } from '../../utils/ui-data';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <i data-lucide="shield" style="width:20px;height:20px;"></i>
        </div>
        <div class="logo-text">
          <span>Realtime Payments</span>
          <strong>Idempotency Lab</strong>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="sidebar-nav" aria-label="Primary navigation">
        <button
          *ngFor="let item of navItems"
          type="button"
          class="nav-item"
          [class.active]="state.activeTab() === item.id"
          (click)="state.setTab(item.id)">
          <i [attr.data-lucide]="item.icon" style="width:18px;height:18px;"></i>
          {{ item.label }}
        </button>
      </nav>

      <!-- System status -->
      <div class="sidebar-system">
        <div class="system-label">System</div>
        <div class="sys-row">
          <i data-lucide="server" style="width:14px;height:14px;color:rgba(255,255,255,0.5)"></i>
          API
          <span class="sys-status online">Online</span>
        </div>
        <div class="sys-row">
          <i data-lucide="database" style="width:14px;height:14px;color:rgba(255,255,255,0.5)"></i>
          Redis
          <span class="sys-status info">Connected</span>
        </div>
        <div class="sys-row">
          <i data-lucide="database" style="width:14px;height:14px;color:rgba(255,255,255,0.5)"></i>
          Postgres
          <span class="sys-status info">Connected</span>
        </div>
      </div>

      <!-- Footer ENV chip -->
      <div class="sidebar-footer">
        <span class="footer-env">Dev Env</span>
        <span class="footer-ver">v2.0</span>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  navItems = SIDEBAR_NAV_ITEMS;

  constructor(public state: PaymentStateService) {}
}
