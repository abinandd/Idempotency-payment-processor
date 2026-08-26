import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { throwError, Subscription, interval } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { SIDEBAR_NAV_ITEMS, BANK_MODES, STAT_CARDS } from './utils/ui-data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, NgxSonnerToaster],
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
    }
    .submit-btn:hover {
      background: #1d4ed8;
    }
    .submit-btn:active {
      transform: scale(0.98);
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
  `],
  template: `
    <ngx-sonner-toaster position="top-right" />
    <div class="admin-shell" (click)="isCurrencyDropdownOpen = false">
      
      <div class="sidebar-backdrop" [class.visible]="sidebarOpen" (click)="sidebarOpen = false"></div>
      
      <aside class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-logo">
          <div class="logo-icon">IL</div>
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
            (click)="activeTab = item.id; sidebarOpen = false"
          >
            <!-- A generic dot icon to look nice if no real icons -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle></svg>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <div class="main-area">
        <div class="mobile-topbar">
          <button class="hamburger" [class.open]="sidebarOpen" (click)="sidebarOpen = !sidebarOpen; $event.stopPropagation()">
            <span></span><span></span><span></span>
          </button>
          <span class="mobile-brand">Idempotency Lab</span>
        </div>

        <header class="page-banner">
          <div class="banner-top">
            <div class="banner-copy">
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
                <span class="stat-label-text">{{ stat.label }}</span>
                <div class="stat-value" [ngClass]="stat.iconClass">{{ stats[stat.id] || 0 }}</div>
                <div class="stat-desc">{{ stat.description }}</div>
              </div>
            </div>

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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <div class="custom-options" *ngIf="isCurrencyDropdownOpen">
                  <div class="custom-option" *ngFor="let c of currencies" (click)="selectCurrency(c)" [class.selected]="currency === c">
                    {{ c }}
                  </div>
                </div>

              </div>
            </div>
            
            <button class="submit-btn" (click)="submitPayment()">
              Pay Now
            </button>
            
            <div *ngIf="response" class="response-card success">
              <h3>Payment Successful</h3>
              <pre>{{ response | json }}</pre>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #cbd5e1; margin-bottom: 12px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
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
  stats: any = {};
  pollSub?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchStats();
    this.pollSub = interval(2000).subscribe(() => this.fetchStats());
  }

  ngOnDestroy() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
  }

  fetchStats() {
    this.http.get('/api/demo/stats').subscribe({
      next: (res) => this.stats = res,
      error: () => {} // ignore mock API errors
    });
  }

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

  submitPayment() {
    this.response = null;
    const headers = new HttpHeaders().set('Idempotency-Key', this.idempotencyKey);
    const body = {
      customerId: this.customerId,
      amount: this.amount,
      currency: this.currency
    };

    this.http.post('/api/payments', body, { headers })
      .pipe(catchError((err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.error || err.message;
        const displayMsg = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg);
        toast.error('Payment Failed', { description: displayMsg });
        return throwError(() => err);
      }))
      .subscribe(res => {
        this.response = res;
      });
  }
}
