import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { Subscription, throwError } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { LucideAngularModule } from 'lucide-angular';
import { SIDEBAR_NAV_ITEMS, BANK_MODES, STAT_CARDS } from './utils/ui-data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    NgxSonnerToaster,
    LucideAngularModule
  ],
  styles: [`
    .payment-card {
      font-family: 'Poppins', sans-serif;
      max-width: 600px;
      margin: 0;
    }
    .header {
      text-align: left;
      margin-bottom: 1.5rem;
    }
    .header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .header p {
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 0.35rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
      position: relative;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .form-row .form-group {
      margin-bottom: 0;
    }
    .flex-2 { flex: 2; }
    .flex-1 { flex: 1; }
    
    label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 500;
      color: #475569;
      font-size: 0.875rem;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
      background: #ffffff;
      color: #0f172a;
    }
    input:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    
    /* Custom Dropdown Styles */
    .custom-select {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
      user-select: none;
    }
    .custom-select.open {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .custom-select .chevron-icon {
      transition: transform 0.2s;
      color: #64748b;
    }
    .custom-select.open .chevron-icon {
      transform: rotate(180deg);
      color: #2563eb;
    }
    .custom-options {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 10;
      overflow: hidden;
    }
    .custom-option {
      padding: 0.75rem 1rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      color: #334155;
      cursor: pointer;
      transition: background 0.1s;
    }
    .custom-option:hover {
      background: #f8fafc;
    }
    .custom-option.selected {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 500;
    }

    small {
      color: #64748b;
      font-size: 0.75rem;
      display: block;
      margin-top: 0.35rem;
    }
    .submit-btn {
      width: auto;
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background-color 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .submit-btn:hover {
      background: #1d4ed8;
    }
    .submit-btn:active {
      transform: scale(0.98);
    }
    .submit-btn[disabled] {
      cursor: not-allowed;
      opacity: 0.85;
    }
    .cancel-btn {
      width: auto;
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #ffffff;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background-color 0.2s, border-color 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .cancel-btn:hover {
      background: #fef2f2;
      border-color: #fca5a5;
    }
    .action-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .spinner {
      animation: rotate 2s linear infinite;
      width: 1.1rem;
      height: 1.1rem;
    }
    .spinner .path {
      stroke: #ffffff;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
    @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }
    .response-card {
      margin-top: 2rem;
      padding: 1.25rem;
      border-radius: 8px;
    }
    .response-card.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .response-card.success h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #166534;
    }
    .response-card.success pre {
      margin: 0;
      font-size: 0.85rem;
      overflow-x: auto;
      color: #15803d;
    }
    .logo-icon,
    .nav-icon,
    .stat-icon,
    .mode-icon,
    .empty-state-icon,
    .chevron-icon,
    .spinner {
      display: inline-flex;
      flex-shrink: 0;
    }
    .logo-icon {
      color: #ffffff;
    }
    .nav-item {
      gap: 10px;
    }
    .nav-icon svg {
      width: 16px;
      height: 16px;
    }
    .stat-icon {
      margin-bottom: 12px;
    }
    .stat-icon svg,
    .mode-icon svg,
    .chevron-icon svg,
    .spinner svg {
      width: 18px;
      height: 18px;
    }
    .mode-icon {
      margin-bottom: 12px;
    }
    .empty-state-icon {
      color: #cbd5e1;
      margin-bottom: 12px;
    }
    .chevron-icon svg {
      width: 16px;
      height: 16px;
    }
  `],
  template: `
    <ngx-sonner-toaster position="top-right" />
    <div class="admin-shell">
      
      <div class="sidebar-backdrop" [class.visible]="sidebarOpen" (click)="sidebarOpen = false; $event.stopPropagation()"></div>
      
      <aside class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-logo">
          <div class="logo-text">
            <span>Payment Processor</span>
            <strong>Idempotency Lab</strong>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <button 
            *ngFor="let item of sidebarItems"
            class="nav-item"
            [class.active]="activeTab === item.id"
            (click)="activeTab = item.id; sidebarOpen = false; $event.stopPropagation()"
          >
            <i-lucide [name]="item.icon" class="nav-icon" [size]="16"></i-lucide>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <div class="main-area">
        <div class="mobile-topbar">
          <button class="hamburger" [class.open]="sidebarOpen" (click)="sidebarOpen = !sidebarOpen; $event.stopPropagation()">
            <i-lucide [name]="sidebarOpen ? 'x-circle' : 'menu'" [size]="20"></i-lucide>
          </button>
          <span class="mobile-brand">Idempotency Lab</span>
        </div>

        <header class="page-banner">
          <div class="banner-top">
            <div class="banner-copy">
              <div class="banner-eyebrow">Dashboard View</div>
              <h1 class="banner-title">{{ getTabLabel() }}</h1>
              <p class="banner-sub">{{ getTabDescription() }}</p>
            </div>
          </div>
        </header>

        <div class="content-area">
          <div *ngIf="activeTab === 'lab'">
            <!-- Stats Row -->
            <div class="stat-grid">
              <div *ngFor="let stat of statCards" class="stat-card" [ngClass]="stat.cardClass">
                <i-lucide [name]="stat.icon" class="stat-icon" [ngClass]="stat.iconClass" [size]="18"></i-lucide>
                <span class="stat-label-text">{{ stat.label }}</span>
                <div class="stat-value" [ngClass]="stat.iconClass">{{ stats[stat.id] || 0 }}</div>
              </div>
            </div>

            <div class="two-col">
              <!-- Payment Form -->
              <div class="payment-card">
                <div class="header">
                  <h1>Secure Payment</h1>
                  <p>Complete your transaction securely</p>
                </div>
                
                <div class="form-group">
                  <label>Idempotency Key</label>
                  <input type="text" [(ngModel)]="idempotencyKey" />
                  <small>Ensures duplicate payments are not processed.</small>
                </div>
                
                <div class="form-group">
                  <label>Customer ID</label>
                  <input type="text" [(ngModel)]="customerId" />
                </div>

                <div class="form-row">
                  <div class="form-group flex-2">
                    <label>Amount</label>
                    <input type="number" [(ngModel)]="amount" />
                  </div>
                  <div class="form-group flex-1">
                    <label>Currency</label>
                    
                    <div class="custom-select" (click)="$event.stopPropagation(); isCurrencyDropdownOpen = !isCurrencyDropdownOpen" [class.open]="isCurrencyDropdownOpen">
                      {{ currency }}
                      <i-lucide name="chevron-down" class="chevron-icon" [size]="16"></i-lucide>
                    </div>
                    <div class="custom-options" *ngIf="isCurrencyDropdownOpen">
                      <div class="custom-option" *ngFor="let c of currencies" (click)="selectCurrency(c)" [class.selected]="currency === c">
                        {{ c }}
                      </div>
                    </div>

                  </div>
                </div>
                
                <div class="action-row">
                  <button class="submit-btn" type="button" (click)="submitPayment()" [disabled]="activeRequests > 0">
                    <span *ngIf="activeRequests === 0">Pay Now</span>
                    <ng-container *ngIf="activeRequests > 0">
                      <i-lucide name="loader-circle" class="spinner" [size]="18"></i-lucide>
                      <span>Processing...</span>
                    </ng-container>
                  </button>

                  <button *ngIf="activeRequests > 0" class="cancel-btn" type="button" (click)="cancelPayment()">
                    <i-lucide name="x-circle" [size]="18"></i-lucide>
                    <span>Cancel</span>
                  </button>
                </div>
                
                <div *ngIf="response" class="response-card success">
                  <h3>Payment Successful</h3>
                  <pre>{{ response | json }}</pre>
                </div>
              </div>

              <!-- Live API Feed -->
              <div class="panel">
                <div class="panel-head">
                  <h3>Live API Feed</h3>
                  <p>Real-time log of outgoing requests</p>
                </div>
                <div class="log-feed" style="max-height: 400px; overflow-y: auto;">
                  <div class="log-entry" *ngFor="let log of apiLogs">
                    <div class="log-dot" [ngStyle]="{'background': log.color}"></div>
                    <div class="log-text">
                      <span style="font-size: 11px; color: #64748b; margin-right: 6px;">{{ log.time | date:'HH:mm:ss.SSS' }}</span>
                      <strong style="color: #0f172a;">{{ log.method }}</strong> {{ log.url }}
                      <div style="margin-top: 4px; font-size: 13px; color: #475569;">
                        Status: <span [ngStyle]="{'color': log.color, 'font-weight': '500'}">{{ log.status }}</span>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="apiLogs.length === 0" style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.9rem;">
                    No requests sent yet. Click "Pay Now" to start.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bank Simulator Tab -->
          <div *ngIf="activeTab === 'bank'" class="bank-simulator">
            <div class="mode-grid">
              <div *ngFor="let mode of bankModes" 
                   class="mode-card" 
                   [class.active]="activeBankMode === mode.id"
                   (click)="setBankMode(mode.id)">
                <i-lucide [name]="mode.icon" class="mode-icon" [ngClass]="mode.colorClass" [size]="18"></i-lucide>
                <div class="active-indicator"></div>
                <div class="mode-name" [ngClass]="mode.colorClass">{{ mode.label }}</div>
                <div class="mode-desc">{{ mode.description }}</div>
              </div>
            </div>
            
            <div class="panel" style="margin-top: 2rem; background: #fff; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <h3 style="margin-top: 0; color: #0f172a; font-weight: 600; font-size: 1.15rem;">Current Provider Behavior</h3>
              <p style="color: #64748b; margin-top: 0.5rem; font-size: 0.95rem;">
                All incoming requests to the API will simulate a <strong style="color: #0f172a;">{{ activeBankMode }}</strong> response.
              </p>
            </div>
          </div>

          <div class="empty-state" *ngIf="activeTab !== 'lab' && activeTab !== 'bank'">
            <i-lucide name="clock" class="empty-state-icon" [size]="32"></i-lucide>
            <strong>Coming soon</strong>
            <span>This section is under development.</span>
          </div>

        </div>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  sidebarItems = SIDEBAR_NAV_ITEMS;
  activeTab = 'lab';
  sidebarOpen = false;
  private currentPaymentSubscription?: Subscription;
  private currentPaymentLogEntry?: { status: string; color: string };

  idempotencyKey = 'payment_' + Date.now();
  amount = 1000;
  customerId = 'cust_12345';
  
  currencies = ['INR', 'USD', 'EUR', 'GBP'];
  currency = 'INR';
  isCurrencyDropdownOpen = false;

  response: any = null;

  bankModes = BANK_MODES;
  activeBankMode = 'SUCCESS';
  
  statCards = STAT_CARDS;
  stats: any = { totalRequests: 0, bankCalls: 0, successfulPayments: 0, duplicateRequests: 0 };
  
  apiLogs: any[] = [];

  activeRequests = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {}
  ngOnDestroy() {}

  setBankMode(modeId: string) {
    this.activeBankMode = modeId;
    this.http.post('/api/demo/bank/mode', { mode: modeId }).subscribe({
      next: () => toast.success(`Bank simulator mode set to ${modeId}`),
      error: () => toast.error(`Failed to set mode ${modeId}`)
    });
  }

  getTabLabel() {
    return this.sidebarItems.find(i => i.id === this.activeTab)?.label || 'Idempotency Lab';
  }

  getTabDescription() {
    return this.sidebarItems.find(i => i.id === this.activeTab)?.description || '';
  }

  selectCurrency(c: string) {
    this.currency = c;
    this.isCurrencyDropdownOpen = false;
  }

  cancelPayment() {
    if (!this.currentPaymentSubscription || this.activeRequests === 0) {
      return;
    }

    this.currentPaymentLogEntry!.status = 'CANCELLED';
    this.currentPaymentLogEntry!.color = '#64748b';
    this.currentPaymentSubscription.unsubscribe();
    this.currentPaymentSubscription = undefined;
    this.currentPaymentLogEntry = undefined;
    toast.info('Payment cancelled');
  }

  submitPayment() {
    if (this.activeRequests > 0) {
      return;
    }

    this.response = null;
    this.activeRequests++;
    this.stats.totalRequests++;
    const headers = new HttpHeaders().set('Idempotency-Key', this.idempotencyKey);
    const body = {
      customerId: this.customerId,
      amount: this.amount,
      currency: this.currency
    };

    const logEntry = {
      time: new Date(),
      method: 'POST',
      url: '/api/payments',
      status: 'PENDING...',
      color: '#94a3b8'
    };
    this.apiLogs.unshift(logEntry);
    this.currentPaymentLogEntry = logEntry;

    this.currentPaymentSubscription = this.http.post('/api/payments', body, { headers })
      .pipe(
        catchError((err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.error || err.message;
        const displayMsg = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg);
        
        if (err.status === 409) {
          this.stats.duplicateRequests++;
          logEntry.status = `DUPLICATE ${err.status} - ${displayMsg}`;
          logEntry.color = '#d97706';
        } else {
          logEntry.status = `ERROR ${err.status} - ${displayMsg}`;
          logEntry.color = '#dc2626';
        }
        
        toast.error('Payment Failed', { description: displayMsg });
        return throwError(() => err);
      }),
      finalize(() => {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.currentPaymentSubscription = undefined;
        this.currentPaymentLogEntry = undefined;
      }))
      .subscribe(res => {
        this.stats.bankCalls++;
        this.stats.successfulPayments++;
        logEntry.status = 'SUCCESS 200';
        logEntry.color = '#16a34a';
        this.response = res;
      });
  }
}
