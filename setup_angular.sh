#!/bin/bash
cd frontend

# Generate proxy config
cat << 'JSON' > proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
JSON

# Update package.json start script
sed -i 's/"start": "ng serve"/"start": "ng serve --proxy-config proxy.conf.json"/g' package.json

# Rewrite app.config.ts for provideHttpClient
cat << 'TS' > src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient()
  ]
};
TS

# Rewrite app.ts
cat << 'TS' > src/app/app.ts
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
TS

# Rewrite app.html
cat << 'HTML' > src/app/app.html
<div style="padding: 20px; font-family: sans-serif;">
  <h1>Idempotent Payment System Demo</h1>
  
  <div style="display: flex; gap: 20px;">
    <div style="flex: 1; border: 1px solid #ccc; padding: 20px;">
      <h2>Bank Simulator Controls</h2>
      <div>Current Mode: {{ bankMode }}</div>
      <br/>
      <button (click)="handleSetBankMode('SUCCESS')">SUCCESS</button>
      <button (click)="handleSetBankMode('FAILURE')">FAILURE</button>
      <button (click)="handleSetBankMode('TIMEOUT')">TIMEOUT</button>
      <button (click)="handleSetBankMode('RANDOM')">RANDOM</button>
    </div>
    
    <div style="flex: 1; border: 1px solid #ccc; padding: 20px;">
      <h2>Live Statistics</h2>
      <div>Total API Requests: {{ stats.totalRequests }}</div>
      <div>Bank Calls: {{ stats.bankCalls }}</div>
      <div>Actual Payments (Success): {{ stats.successfulPayments }}</div>
      <div>Duplicate Requests safely handled: {{ stats.duplicateRequests }}</div>
    </div>
  </div>
  
  <div style="margin-top: 20px; border: 1px solid #ccc; padding: 20px;">
    <h2>Demo Actions</h2>
    <button (click)="send10Requests()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
      SEND 10 IDENTICAL REQUESTS
    </button>
  </div>

  <div style="margin-top: 20px; border: 1px solid #ccc; padding: 20px;">
    <h2>Timeline</h2>
    <ul>
      <li *ngFor="let t of timeline">{{ t }}</li>
    </ul>
  </div>
</div>
HTML
