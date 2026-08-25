import { Component, Output, EventEmitter, AfterViewInit, ElementRef, QueryList, ViewChildren, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStateService, PaymentTab } from '../../services/payment-state';
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
        <div class="logo-text">
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
          <span class="sys-dot" [ngClass]="state.systemHealth().api === 'Online' ? 'online' : 'error'"></span>
          API
          <span class="sys-status" [ngClass]="state.systemHealth().api === 'Online' ? 'online' : 'error'">{{ state.systemHealth().api }}</span>
        </div>
        <div class="sys-row">
          <span class="sys-dot" [ngClass]="state.systemHealth().redis === 'Connected' ? 'info' : 'error'"></span>
          Redis
          <span class="sys-status" [ngClass]="state.systemHealth().redis === 'Connected' ? 'info' : 'error'">{{ state.systemHealth().redis }}</span>
        </div>
        <div class="sys-row">
          <span class="sys-dot" [ngClass]="state.systemHealth().postgres === 'Connected' ? 'info' : 'error'"></span>
          Postgres
          <span class="sys-status" [ngClass]="state.systemHealth().postgres === 'Connected' ? 'info' : 'error'">{{ state.systemHealth().postgres }}</span>
        </div>
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
    this.state.setTab(id as PaymentTab);
    this.tabChange.emit();
  }
}
