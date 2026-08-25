import { Injectable, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type PaymentTab = 'overview' | 'lab' | 'bank' | 'timeline';
export type BankMode = 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
export type LabRequestStatus = 'pending' | 'success' | 'conflict' | 'error';

export interface LabRequest {
  index: number;
  status: LabRequestStatus;
  data?: any;
  message?: string;
}

export interface PaymentStats {
  totalRequests: number;
  successfulPayments: number;
  duplicateRequests: number;
  bankCalls: number;
}

export interface SystemHealth {
  api: string;
  redis: string;
  postgres: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentStateService implements OnDestroy {
  stats = signal<PaymentStats>({ totalRequests: 0, successfulPayments: 0, duplicateRequests: 0, bankCalls: 0 });
  systemHealth = signal<SystemHealth>({ api: 'Offline', redis: 'Unknown', postgres: 'Unknown' });
  bankMode = signal<BankMode>('SUCCESS');
  timeline = signal<string[]>([]);
  activeTab = signal<PaymentTab>('overview');
  
  // For idempotency lab
  labRequestCount = signal(10);
  labAmount = signal(1000);
  labRequests = signal<LabRequest[]>([]);
  isProcessing = signal(false);

  private statsInterval?: ReturnType<typeof setInterval>;

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  private startPolling() {
    this.fetchStats();
    this.fetchSystemHealth();
    this.statsInterval = setInterval(() => {
      this.fetchStats();
      this.fetchSystemHealth();
    }, 2000);
  }

  fetchStats() {
    this.http.get<PaymentStats>('/api/demo/stats').subscribe({
      next: (data) => this.stats.set(data),
      error: () => {}
    });
  }

  fetchSystemHealth() {
    this.http.get<SystemHealth>('/api/system/health').subscribe({
      next: (data) => this.systemHealth.set(data),
      error: () => this.systemHealth.set({ api: 'Offline', redis: 'Disconnected', postgres: 'Disconnected' })
    });
  }

  setLabAmount(amount: number) {
    const normalized = Number.isFinite(amount) ? Math.max(1, Math.round(amount)) : 1;
    this.labAmount.set(normalized);
  }

  setLabRequestCount(count: number) {
    const normalized = Number.isFinite(count) ? Math.max(1, Math.min(20, Math.round(count))) : 1;
    this.labRequestCount.set(normalized);
  }

  private formatTimelineEntry(message: string) {
    const stamp = new Date().toLocaleTimeString([], { hour12: false });
    return `${stamp} · ${message}`;
  }

  addTimeline(msg: string) {
    this.timeline.update(entries => [this.formatTimelineEntry(msg), ...entries].slice(0, 50));
  }

  setTab(tab: PaymentTab) {
    this.activeTab.set(tab);
  }

  async handleSetBankMode(mode: BankMode) {
    try {
      await firstValueFrom(this.http.post('/api/demo/bank/mode', {
        mode: mode,
        delayMs: mode === 'TIMEOUT' ? 5000 : 0
      }));
      this.bankMode.set(mode);
      this.addTimeline(`Bank mode updated to ${mode}`);
    } catch (err) {
      this.addTimeline(`Failed to update bank mode`);
    }
  }

  async runLab() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    
    const count = Math.max(1, this.labRequestCount());
    const idempotencyKey = 'demo-' + Date.now();
    this.addTimeline(`Lab: Sending ${count} concurrent requests with key ${idempotencyKey}`);

    this.labRequests.set(Array.from({ length: count }).map((_, i) => ({ index: i + 1, status: 'pending' })));

    const reqs = Array.from({ length: count }).map(async (_, index) => {
      try {
        const response = await firstValueFrom(this.http.post<any>('/api/payments', 
          { amount: this.labAmount(), currency: 'INR', customerId: 'cust-123' },
          { headers: { 'Idempotency-Key': idempotencyKey } }
        ));
        
        this.labRequests.update(arr => {
          const newArr = [...arr];
          newArr[index] = { index: index + 1, status: 'success', data: response };
          return newArr;
        });
        return { index, status: 'success', data: response };
      } catch (e: any) {
        if (e.status === 409) {
          this.labRequests.update(arr => {
            const newArr = [...arr];
            newArr[index] = { index: index + 1, status: 'conflict', data: e.error };
            return newArr;
          });
          return { index, status: 'conflict', data: e.error };
        }
        
        this.labRequests.update(arr => {
          const newArr = [...arr];
          newArr[index] = { index: index + 1, status: 'error', message: e.message };
          return newArr;
        });
        return { index, status: 'error', message: e.message };
      }
    });

    await Promise.all(reqs);
    this.addTimeline(`Lab: All ${count} responses received.`);
    this.fetchStats();
    this.isProcessing.set(false);
  }
}
