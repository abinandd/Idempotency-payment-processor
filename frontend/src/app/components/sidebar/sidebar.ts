import { Component, Output, EventEmitter, AfterViewInit, ElementRef, QueryList, ViewChildren, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../../services/payment-state';
import { AnimationService } from '../../services/animation.service';
import { SIDEBAR_NAV_ITEMS } from '../../utils/ui-data';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" #sidebarEl>
      <!-- Logo -->
      <div class="sidebar-logo" #logoEl>
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
          *ngFor="let item of navItems; let i = index"
          type="button"
          class="nav-item"
          [class.active]="state.activeTab() === item.id"
          (click)="onNav(item.id)"
          #navBtn>
          <i [attr.data-lucide]="item.icon" style="width:17px;height:17px;"></i>
          {{ item.label }}
        </button>
      </nav>

      <!-- System status -->
      <div class="sidebar-system" #systemEl>
        <div class="system-label">System</div>
        <div class="sys-row">
          <span class="sys-dot online"></span>
          <i data-lucide="server" style="width:13px;height:13px;color:rgba(255,255,255,0.45)"></i>
          API
          <span class="sys-status online">Online</span>
        </div>
        <div class="sys-row">
          <span class="sys-dot info"></span>
          <i data-lucide="database" style="width:13px;height:13px;color:rgba(255,255,255,0.45)"></i>
          Redis
          <span class="sys-status info">Connected</span>
        </div>
        <div class="sys-row">
          <span class="sys-dot info"></span>
          <i data-lucide="database" style="width:13px;height:13px;color:rgba(255,255,255,0.45)"></i>
          Postgres
          <span class="sys-status info">Connected</span>
        </div>
      </div>

      <!-- Footer ENV chip -->
      <div class="sidebar-footer" #footerEl>
        <span class="footer-env">Dev Env</span>
        <span class="footer-ver">v2.0</span>
      </div>
    </aside>
  `
})
export class SidebarComponent implements AfterViewInit {
  @Output() tabChange = new EventEmitter<void>();
  @ViewChild('sidebarEl') sidebarEl!: ElementRef<HTMLElement>;
  @ViewChild('logoEl') logoEl!: ElementRef<HTMLElement>;
  @ViewChild('systemEl') systemEl!: ElementRef<HTMLElement>;
  @ViewChild('footerEl') footerEl!: ElementRef<HTMLElement>;
  @ViewChildren('navBtn') navBtns!: QueryList<ElementRef<HTMLElement>>;

  navItems = SIDEBAR_NAV_ITEMS;

  constructor(public state: PaymentStateService, private anim: AnimationService) {}

  ngAfterViewInit() {
    // Sidebar slides in from left
    this.anim.sidebarIn(this.sidebarEl.nativeElement);

    // Logo, nav items, system section, footer stagger in
    const items: HTMLElement[] = [
      this.logoEl.nativeElement,
      ...this.navBtns.map(b => b.nativeElement),
      this.systemEl.nativeElement,
      this.footerEl.nativeElement
    ];
    this.anim.staggerIn(items, { y: 14, delay: 0.15, stagger: 0.055, duration: 0.4 });
  }

  onNav(id: string) {
    this.state.setTab(id);
    this.tabChange.emit();
  }
}
