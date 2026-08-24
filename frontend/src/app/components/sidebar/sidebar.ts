import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';

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
        <div class="nav-item" [class.active]="state.activeTab() === 'overview'" (click)="state.setTab('overview')">
          <i data-lucide="layout"></i> Overview
        </div>
        <div class="nav-item" [class.active]="state.activeTab() === 'lab'" (click)="state.setTab('lab')">
          <i data-lucide="zap"></i> Idempotency Lab
        </div>
        <div class="nav-item" [class.active]="state.activeTab() === 'bank'" (click)="state.setTab('bank')">
          <i data-lucide="landmark"></i> Bank Simulator
        </div>
        <div class="nav-item" [class.active]="state.activeTab() === 'timeline'" (click)="state.setTab('timeline')">
          <i data-lucide="list"></i> Event Timeline
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
  constructor(public state: PaymentStateService) {}
}
