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
      <div class="sidebar-header">
        <i data-lucide="shield" class="icon-inline text-accent"></i>
        <span class="text-gradient">Payment Engine</span>
      </div>
      
      <div class="sidebar-nav">
        <div 
          *ngFor="let item of navItems" 
          class="nav-item" 
          [class.active]="state.activeTab() === item.id" 
          (click)="state.setTab(item.id)">
          <i [attr.data-lucide]="item.icon"></i> {{ item.label }}
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="status-item"><i data-lucide="server" class="icon-small text-success"></i> API: Online</div>
        <div class="status-item"><i data-lucide="database" class="icon-small text-accent"></i> Redis: Connected</div>
        <div class="status-item"><i data-lucide="database" class="icon-small text-accent"></i> Postgres: Connected</div>
        <div class="env-badge">Dev Env</div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  navItems = SIDEBAR_NAV_ITEMS;

  constructor(public state: PaymentStateService) {}
}
