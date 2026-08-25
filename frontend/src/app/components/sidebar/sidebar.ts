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

      <!-- Brand -->
      <div class="sidebar-logo" #logoEl>
        <div class="logo-icon">
          <i data-lucide="shield" style="width:19px;height:19px;"></i>
        </div>
        <div class="logo-text">
          <span>Realtime Payments</span>
          <strong>Idempotency Lab</strong>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" aria-label="Primary navigation">
        <button
          *ngFor="let item of navItems"
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
          API
          <span class="sys-status online">Online</span>
        </div>
        <div class="sys-row">
          <span class="sys-dot info"></span>
          Redis
          <span class="sys-status info">Connected</span>
        </div>
        <div class="sys-row">
          <span class="sys-dot info"></span>
          Postgres
          <span class="sys-status info">Connected</span>
        </div>
      </div>

      <!-- Footer -->
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
  @ViewChild('logoEl')    logoEl!: ElementRef<HTMLElement>;
  @ViewChild('systemEl')  systemEl!: ElementRef<HTMLElement>;
  @ViewChild('footerEl')  footerEl!: ElementRef<HTMLElement>;
  @ViewChildren('navBtn') navBtns!: QueryList<ElementRef<HTMLElement>>;

  navItems = SIDEBAR_NAV_ITEMS;

  constructor(public state: PaymentStateService, private anim: AnimationService) {}

  ngAfterViewInit() {
    this.anim.sidebarIn(this.sidebarEl.nativeElement);
    const items: HTMLElement[] = [
      this.logoEl.nativeElement,
      ...this.navBtns.map(b => b.nativeElement),
      this.systemEl.nativeElement,
      this.footerEl.nativeElement
    ];
    this.anim.staggerIn(items, { y: 12, delay: 0.18, stagger: 0.055, duration: 0.38 });
  }

  onNav(id: string) {
    this.state.setTab(id);
    this.tabChange.emit();
  }
}
