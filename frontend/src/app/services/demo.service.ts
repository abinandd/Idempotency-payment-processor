import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankModeState, DemoStats, SystemHealth } from '../models';

@Injectable({ providedIn: 'root' })
export class DemoService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<Partial<DemoStats>> {
    return this.http.get<Partial<DemoStats>>('/api/demo/stats');
  }

  resetStats(): Observable<unknown> {
    return this.http.post('/api/demo/stats/reset', {});
  }

  getHealth(): Observable<SystemHealth> {
    return this.http.get<SystemHealth>('/api/system/health');
  }

  getBankMode(): Observable<BankModeState> {
    return this.http.get<BankModeState>('/api/demo/bank/mode');
  }

  setBankMode(mode: string, delayMs: number): Observable<unknown> {
    return this.http.post('/api/demo/bank/mode', { mode, delayMs });
  }

  getTimeline(): Observable<string[]> {
    return this.http.get<string[]>('/api/demo/timeline');
  }
}
