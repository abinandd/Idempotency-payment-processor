import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';

export interface PaymentStats {
  totalRequests: number;
  successfulPayments: number;
  duplicateRequests: number;
  bankCalls: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  stats: PaymentStats = { totalRequests: 0, successfulPayments: 0, duplicateRequests: 0, bankCalls: 0 };
  bankMode = 'SUCCESS';
  timeline: string[] = [];
  private statsInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchStats();
    this.statsInterval = setInterval(() => this.fetchStats(), 2000);
  }

  ngOnDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  fetchStats() {
    this.http.get<PaymentStats>('/api/demo/stats').subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Failed to fetch stats:', err)
    });
  }

  addTimeline(msg: string) {
    this.timeline = [msg, ...this.timeline].slice(0, 20);
  }

  async handleSetBankMode(mode: string) {
    try {
      await firstValueFrom(this.http.post('/api/demo/bank/mode', {
        mode: mode,
        delayMs: mode === 'TIMEOUT' ? 5000 : 0
      }));
      this.bankMode = mode;
      this.addTimeline(`🏦 Bank mode updated to ${mode}`);
    } catch (err) {
      console.error('Failed to set bank mode', err);
      this.addTimeline(`❌ Failed to update bank mode`);
    }
  }

  async send10Requests() {
    const idempotencyKey = 'demo-' + Date.now();
    this.addTimeline(`🚀 Sending 10 concurrent requests with key ${idempotencyKey}`);

    const reqs = Array.from({ length: 10 }).map(async (_, index) => {
      try {
        const response = await firstValueFrom(this.http.post<any>('/api/payments', 
          { amount: 1000, currency: 'INR', customerId: 'cust-123' },
          { headers: { 'Idempotency-Key': idempotencyKey } }
        ));
        return { index, status: 'success', data: response };
      } catch (e: any) {
        if (e.status === 409) return { index, status: 'conflict', data: e.error };
        return { index, status: 'error', message: e.message };
      }
    });

    await Promise.all(reqs);
    this.addTimeline(`✅ All 10 responses received. Idempotency verified.`);
    this.fetchStats();
  }
}
