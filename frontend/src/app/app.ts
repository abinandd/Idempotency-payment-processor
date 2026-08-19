import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  stats = { totalRequests: 0, successfulPayments: 0, duplicateRequests: 0, bankCalls: 0 };
  bankMode = 'SUCCESS';
  timeline: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchStats();
    setInterval(() => this.fetchStats(), 2000);
  }

  fetchStats() {
    this.http.get<any>('/api/demo/stats').subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error(err)
    });
  }

  addTimeline(msg: string) {
    this.timeline = [msg, ...this.timeline].slice(0, 20);
  }

  async handleSetBankMode(mode: string) {
    await firstValueFrom(this.http.post('/api/demo/bank/mode', {
      mode: mode,
      delayMs: mode === 'TIMEOUT' ? 5000 : 0
    }));
    this.bankMode = mode;
    this.addTimeline(`Bank mode set to ${mode}`);
  }

  async send10Requests() {
    const idempotencyKey = 'demo-' + Date.now();
    this.addTimeline(`Sending 10 requests with key ${idempotencyKey}`);

    const reqs = Array.from({ length: 10 }).map(() => {
      return firstValueFrom(this.http.post('/api/payments', 
        { amount: 1000, currency: 'INR', customerId: 'cust-123' },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      )).catch(e => {
        if (e.status === 409) return e.error;
        return { error: e.message };
      });
    });

    const results = await Promise.all(reqs);
    this.addTimeline(`Received 10 responses`);
    console.log(results);
    this.fetchStats();
  }
}
