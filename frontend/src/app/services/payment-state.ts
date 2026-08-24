import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PaymentStats {
  totalRequests: number;
  successfulPayments: number;
  duplicateRequests: number;
  bankCalls: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentStateService {
  stats = signal<PaymentStats>({ totalRequests: 0, successfulPayments: 0, duplicateRequests: 0, bankCalls: 0 });
  bankMode = signal('SUCCESS');
  timeline = signal<string[]>([]);
  activeTab = signal('overview');
  
  // For idempotency lab
  labRequestCount = signal(10);
  labAmount = signal(1000);
  labRequests = signal<{index: number, status: string, data?: any, message?: string}[]>([]);
  isProcessing = signal(false);

  private statsInterval: any;

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  private startPolling() {
    this.fetchStats();
    this.statsInterval = setInterval(() => this.fetchStats(), 2000);
  }

  fetchStats() {
    this.http.get<PaymentStats>('/api/demo/stats').subscribe({
      next: (data) => this.stats.set(data),
      error: () => {}
    });
  }

  addTimeline(msg: string) {
    this.timeline.update(t => [msg, ...t].slice(0, 50));
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  async handleSetBankMode(mode: string) {
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
    
    const count = this.labRequestCount();
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
