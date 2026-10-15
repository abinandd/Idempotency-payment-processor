import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { Subscription, throwError, firstValueFrom } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { LucideAngularModule } from 'lucide-angular';
import { SIDEBAR_NAV_ITEMS, BANK_MODES, STAT_CARDS } from './constants/ui-data';
import { ApiLogEntry, BurstResult, DemoStats, PaymentResponse, SystemHealth, TimelineEvent } from './models';
import { DemoService } from './services/demo.service';
import { PaymentService } from './services/payment.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSonnerToaster, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {
  sidebarItems = SIDEBAR_NAV_ITEMS;
  activeTab = 'lab';
  sidebarOpen = false;
  private currentPaymentSubscription?: Subscription;
  private currentPaymentLogEntry?: ApiLogEntry;
  private pollInterval?: any;

  // Single payment form
  idempotencyKey = 'payment_' + Date.now();
  amount = 1000;
  customerId = 'cust_12345';
  currencies = ['INR', 'USD', 'EUR', 'GBP'];
  currency = 'INR';
  isCurrencyDropdownOpen = false;
  response: PaymentResponse | null = null;

  // Bank Simulator
  bankModes = BANK_MODES;
  activeBankMode = 'SUCCESS';
  bankDelayMs = 5000;

  // Stats & Health
  statCards = STAT_CARDS;
  stats: DemoStats = { totalRequests: 0, bankCalls: 0, successfulPayments: 0, duplicateRequests: 0 };
  systemHealth: SystemHealth = { api: 'Online', redis: 'Connected', postgres: 'Connected' };

  // Live feed & Timeline
  apiLogs: ApiLogEntry[] = [];
  timelineEvents: TimelineEvent[] = [];

  // Concurrent Burst Lab
  burstCount = 10;
  burstKey = 'burst_' + Date.now();
  isBurstRunning = false;
  burstResults: BurstResult[] = [];
  burstSuccessCount = 0;
  burstBlockedCount = 0;

  activeRequests = 0;

  constructor(
    private demo: DemoService,
    private payments: PaymentService
  ) {}

  ngOnInit() {
    this.refreshAllState();
    this.pollInterval = setInterval(() => {
      this.fetchStats();
      this.fetchSystemHealth();
      this.fetchTimeline();
    }, 2500);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.currentPaymentSubscription) {
      this.currentPaymentSubscription.unsubscribe();
    }
  }

  refreshAllState() {
    this.fetchStats();
    this.fetchSystemHealth();
    this.fetchBankMode();
    this.fetchTimeline();
  }

  fetchStats() {
    this.demo.getStats().subscribe({
      next: (data) => {
        if (data) {
          this.stats = { ...this.stats, ...data } as DemoStats;
        }
      },
      error: () => {}
    });
  }

  fetchSystemHealth() {
    this.demo.getHealth().subscribe({
      next: (health) => {
        if (health) {
          this.systemHealth = health;
        }
      },
      error: () => {
        this.systemHealth = { api: 'Offline', redis: 'Disconnected', postgres: 'Disconnected' };
      }
    });
  }

  fetchBankMode() {
    this.demo.getBankMode().subscribe({
      next: (data) => {
        if (data && data.mode) {
          this.activeBankMode = data.mode;
        }
        if (data && data.timeoutMs) {
          this.bankDelayMs = data.timeoutMs;
        }
      },
      error: () => {}
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isCurrencyDropdownOpen = false;
  }

  formatIsoTime(isoStr: string): string {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return isNaN(date.getTime()) ? isoStr : date.toLocaleTimeString();
    } catch {
      return isoStr;
    }
  }

  fetchTimeline() {
    this.demo.getTimeline().subscribe({
      next: (list) => {
        if (Array.isArray(list)) {
          this.timelineEvents = list.map(item => {
            const parts = item.split(' - ');
            if (parts.length >= 2) {
              const time = this.formatIsoTime(parts[0]);
              const message = parts.slice(1).join(' - ');
              return { time, message };
            }
            return { time: '', message: item };
          });
        }
      },
      error: () => {}
    });
  }

  resetStats() {
    this.demo.resetStats().subscribe({
      next: () => {
        this.stats = { totalRequests: 0, bankCalls: 0, successfulPayments: 0, duplicateRequests: 0 };
        this.burstResults = [];
        this.timelineEvents = [];
        this.apiLogs = [];
        this.response = null;
        toast.success('Demo stats and timeline reset');
        this.refreshAllState();
      },
      error: () => toast.error('Failed to reset stats')
    });
  }

  setBankMode(modeId: string) {
    this.activeBankMode = modeId;
    this.demo.setBankMode(modeId, modeId === 'TIMEOUT' ? this.bankDelayMs : 0).subscribe({
      next: () => {
        toast.success(`Bank simulator mode set to ${modeId}`);
        this.fetchTimeline();
      },
      error: () => toast.error(`Failed to set mode ${modeId}`)
    });
  }

  updateBankDelay() {
    if (this.activeBankMode === 'TIMEOUT') {
      this.demo.setBankMode('TIMEOUT', this.bankDelayMs).subscribe({
        next: () => toast.success(`Timeout delay set to ${this.bankDelayMs} ms`),
        error: () => toast.error('Failed to update delay')
      });
    }
  }

  regenerateSingleKey() {
    this.idempotencyKey = 'payment_' + Date.now();
  }

  regenerateBurstKey() {
    this.burstKey = 'burst_' + Date.now();
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

    if (this.currentPaymentLogEntry) {
      this.currentPaymentLogEntry.status = 'CANCELLED';
      this.currentPaymentLogEntry.color = '#64748b';
    }
    this.currentPaymentSubscription.unsubscribe();
    this.currentPaymentSubscription = undefined;
    this.currentPaymentLogEntry = undefined;
    toast.info('Payment cancelled');
  }

  submitPayment() {
    if (this.activeRequests > 0 || this.isBurstRunning) {
      return;
    }

    if (!this.customerId || !this.customerId.trim()) {
      toast.warning('Please enter a Customer ID');
      return;
    }
    if (!this.amount || this.amount <= 0) {
      toast.warning('Please enter an amount greater than 0');
      return;
    }
    if (!this.idempotencyKey || !this.idempotencyKey.trim()) {
      toast.warning('Please provide an Idempotency Key');
      return;
    }

    this.response = null;
    this.activeRequests++;
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

    this.currentPaymentSubscription = this.payments.pay(this.idempotencyKey, body)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const errorMsg = err.error?.message || err.error || err.message;
          const displayMsg = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg);
          
          if (err.status === 409) {
            logEntry.status = `DUPLICATE 409 - Blocked in flight`;
            logEntry.color = '#d97706';
            toast.warning('Duplicate Request Blocked (409 Conflict)', { description: displayMsg });
          } else {
            logEntry.status = `ERROR ${err.status} - ${displayMsg}`;
            logEntry.color = '#dc2626';
            toast.error('Payment Failed', { description: displayMsg });
          }
          this.fetchStats();
          this.fetchTimeline();
          return throwError(() => err);
        }),
        finalize(() => {
          this.activeRequests = Math.max(0, this.activeRequests - 1);
          this.currentPaymentSubscription = undefined;
          this.currentPaymentLogEntry = undefined;
        })
      )
      .subscribe(res => {
        this.response = res;
        if (res.status === 'SUCCESS') {
          logEntry.status = 'SUCCESS 200';
          logEntry.color = '#16a34a';
          toast.success('Payment Approved by Bank');
        } else if (res.status === 'FAILED') {
          logEntry.status = 'FAILED 200 - Bank Rejected';
          logEntry.color = '#dc2626';
          toast.error('Payment Rejected by Bank', { description: res.message });
        } else if (res.status === 'UNKNOWN') {
          logEntry.status = 'UNKNOWN 200 - Bank Timed Out';
          logEntry.color = '#d97706';
          toast.warning('Bank Response Timed Out', { description: 'Status UNKNOWN — awaiting reconciliation' });
        }
        this.fetchStats();
        this.fetchTimeline();
      });
  }

  async launchBurst() {
    if (this.isBurstRunning || this.activeRequests > 0) {
      return;
    }

    if (!this.burstKey || !this.burstKey.trim()) {
      this.regenerateBurstKey();
    }

    this.isBurstRunning = true;
    this.burstResults = [];
    this.burstSuccessCount = 0;
    this.burstBlockedCount = 0;

    const count = this.burstCount;
    const sharedKey = this.burstKey;
    const payload = {
      customerId: this.customerId,
      amount: this.amount,
      currency: this.currency
    };

    toast.info(`Firing ${count} concurrent requests with shared key...`);

    const logEntry = {
      time: new Date(),
      method: 'BURST POST (x' + count + ')',
      url: '/api/payments',
      status: `Firing ${count} simultaneous requests...`,
      color: '#2563eb'
    };
    this.apiLogs.unshift(logEntry);

    const startTime = Date.now();
    const requests = Array.from({ length: count }, (_, i) => {
      const reqStart = Date.now();
      return firstValueFrom(this.payments.pay(sharedKey, payload))
        .then(res => {
          const latency = Date.now() - reqStart;
          return {
            index: i + 1,
            status: 'SUCCESS' as const,
            statusCode: 200,
            message: `200 OK — ${res.status}: ${res.message || 'Processed'} (ID: ${res.paymentId})`,
            timeMs: latency,
            data: res
          };
        })
        .catch(err => {
          const latency = Date.now() - reqStart;
          if (err.status === 409) {
            return {
              index: i + 1,
              status: 'CONFLICT' as const,
              statusCode: 409,
              message: '409 Conflict — Duplicate request blocked (Lock contention)',
              timeMs: latency,
              data: err.error
            };
          }
          return {
            index: i + 1,
            status: 'ERROR' as const,
            statusCode: err.status || 500,
            message: `${err.status || 500} — ${err.error?.message || err.message || 'Request failed'}`,
            timeMs: latency
          };
        });
    });

    try {
      const results = await Promise.all(requests);
      this.burstResults = results;
      this.burstSuccessCount = results.filter(r => r.statusCode === 200).length;
      this.burstBlockedCount = results.filter(r => r.statusCode === 409).length;

      const totalTime = Date.now() - startTime;
      logEntry.status = `Completed in ${totalTime}ms: ${this.burstSuccessCount} OK, ${this.burstBlockedCount} Blocked`;
      logEntry.color = '#16a34a';

      toast.success(`Burst Finished: Bank called ${this.burstSuccessCount} time, ${this.burstBlockedCount} blocked!`);
      this.fetchStats();
      this.fetchTimeline();
    } finally {
      this.isBurstRunning = false;
    }
  }
}
