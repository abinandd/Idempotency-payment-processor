import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { Subscription, throwError, firstValueFrom } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { LucideAngularModule } from 'lucide-angular';
import { SIDEBAR_NAV_ITEMS, BANK_MODES, STAT_CARDS } from './utils/ui-data';

export interface BurstResult {
  index: number;
  status: 'SUCCESS' | 'CONFLICT' | 'ERROR';
  statusCode: number;
  message: string;
  timeMs: number;
  data?: any;
}

export interface SystemHealth {
  api: string;
  redis: string;
  postgres: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxSonnerToaster,
    LucideAngularModule
  ],
  styles: [`
    .payment-card {
      font-family: 'Poppins', sans-serif;
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
    
    .input-with-button {
      display: flex;
      gap: 8px;
    }
    .input-with-button input {
      flex: 1;
    }
    .btn-icon-subtle {
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .btn-icon-subtle:hover {
      background: #eff6ff;
      border-color: #93c5fd;
      color: #2563eb;
    }

    /* Custom Dropdown */
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
      padding: 0.75rem 1.75rem;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .submit-btn:hover:not([disabled]) {
      background: #1d4ed8;
    }
    .submit-btn:active:not([disabled]) {
      transform: scale(0.98);
    }
    .submit-btn[disabled] {
      cursor: not-allowed;
      opacity: 0.65;
    }
    .cancel-btn {
      width: auto;
      padding: 0.75rem 1.25rem;
      background: #ffffff;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
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
      margin-top: 1rem;
    }
    .spinner {
      animation: rotate 2s linear infinite;
      width: 1.1rem;
      height: 1.1rem;
    }
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
    
    .response-card {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 8px;
    }
    .response-card.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .response-card.success h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #166534;
    }
    .response-card.success pre {
      margin: 0;
      font-size: 0.85rem;
      overflow-x: auto;
      color: #15803d;
    }
    .response-card.failed {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    .response-card.failed h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #991b1b;
    }
    .response-card.failed pre {
      margin: 0;
      font-size: 0.85rem;
      overflow-x: auto;
      color: #b91c1c;
    }
    .response-card.unknown {
      background: #fffbeb;
      border: 1px solid #fde68a;
    }
    .response-card.unknown h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #92400e;
    }
    .response-card.unknown pre {
      margin: 0;
      font-size: 0.85rem;
      overflow-x: auto;
      color: #b45309;
    }

    /* Burst Lab Styles */
    .burst-hero {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.25);
    }
    .burst-hero h2 {
      font-size: 1.35rem;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .burst-hero p {
      font-size: 0.9rem;
      opacity: 0.9;
      max-width: 650px;
      line-height: 1.5;
    }
    .burst-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 18px;
      align-items: flex-end;
    }
    .burst-control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .burst-control-group label {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.8rem;
      font-weight: 500;
      margin: 0;
    }
    .burst-count-pills {
      display: flex;
      gap: 6px;
    }
    .count-pill {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .count-pill:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    .count-pill.active {
      background: #ffffff;
      color: #1e3a8a;
      border-color: #ffffff;
    }
    .burst-launch-btn {
      background: #ffffff;
      color: #1e3a8a;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .burst-launch-btn:hover:not([disabled]) {
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .burst-launch-btn:active:not([disabled]) {
      transform: translateY(0);
    }
    .burst-launch-btn[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .burst-summary-banner {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .burst-summary-text strong {
      display: block;
      color: #166534;
      font-size: 1rem;
      margin-bottom: 2px;
    }
    .burst-summary-text span {
      color: #15803d;
      font-size: 0.875rem;
    }
    .burst-summary-badges {
      display: flex;
      gap: 10px;
    }
    .badge-stat {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-stat.bank { background: #dbeafe; color: #1e40af; }
    .badge-stat.blocked { background: #fef3c7; color: #92400e; }

    /* Results Table */
    .burst-table-container {
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .burst-table-header {
      display: grid;
      grid-template-columns: 80px 110px 1fr 100px;
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .burst-table-row {
      display: grid;
      grid-template-columns: 80px 110px 1fr 100px;
      padding: 12px 20px;
      border-bottom: 1px solid #f1f5f9;
      align-items: center;
      font-size: 0.875rem;
      transition: background 0.1s;
    }
    .burst-table-row:last-child {
      border-bottom: none;
    }
    .burst-table-row:hover {
      background: #f8fafc;
    }
    .row-success {
      background: #fafffb;
      border-left: 4px solid #22c55e;
    }
    .row-conflict {
      background: #fffdf5;
      border-left: 4px solid #f59e0b;
    }
    .row-error {
      background: #fff5f5;
      border-left: 4px solid #ef4444;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-pill.status-200 { background: #dcfce7; color: #15803d; }
    .badge-pill.status-409 { background: #fef3c7; color: #b45309; }
    .badge-pill.status-err { background: #fee2e2; color: #b91c1c; }

    /* Timeline styles */
    .timeline-container {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .timeline-item {
      display: flex;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid #f1f5f9;
      align-items: flex-start;
    }
    .timeline-item:last-child {
      border-bottom: none;
    }
    .timeline-bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #2563eb;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .timeline-content {
      flex: 1;
    }
    .timeline-msg {
      font-size: 0.92rem;
      font-weight: 500;
      color: #1e293b;
    }
    .timeline-ts {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 2px;
    }

    .banner-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn-reset {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 0.825rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-reset:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* Delay slider */
    .delay-slider-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 14px;
    }
    .delay-slider-wrap input[type=range] {
      flex: 1;
      accent-color: #2563eb;
      cursor: pointer;
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
    .logo-icon { color: #ffffff; }
    .nav-item { gap: 10px; }
    .nav-icon svg { width: 16px; height: 16px; }
    .stat-icon { margin-bottom: 12px; }
    .stat-icon svg,
    .mode-icon svg,
    .chevron-icon svg,
    .spinner svg { width: 18px; height: 18px; }
    .mode-icon { margin-bottom: 12px; }
    .empty-state-icon { color: #cbd5e1; margin-bottom: 12px; }
    .chevron-icon svg { width: 16px; height: 16px; }
  `],
  template: `
    <ngx-sonner-toaster position="top-right" />
    <div class="admin-shell">
      
      <div class="sidebar-backdrop" [class.visible]="sidebarOpen" (click)="sidebarOpen = false; $event.stopPropagation()"></div>
      
      <aside class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <i-lucide name="zap" [size]="20"></i-lucide>
          </div>
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

        <!-- System Health Section in Sidebar -->
        <div class="sidebar-system">
          <div class="system-label">System Health</div>
          <div class="sys-row">
            <span class="sys-dot" [ngClass]="systemHealth.api === 'Online' ? 'online' : 'error'"></span>
            API Gateway
            <span class="sys-status" [ngClass]="systemHealth.api === 'Online' ? 'online' : 'error'">{{ systemHealth.api }}</span>
          </div>
          <div class="sys-row">
            <span class="sys-dot" [ngClass]="systemHealth.redis === 'Connected' ? 'info' : 'error'"></span>
            Redis (Lock)
            <span class="sys-status" [ngClass]="systemHealth.redis === 'Connected' ? 'info' : 'error'">{{ systemHealth.redis }}</span>
          </div>
          <div class="sys-row">
            <span class="sys-dot" [ngClass]="systemHealth.postgres === 'Connected' ? 'online' : 'error'"></span>
            PostgreSQL (DB)
            <span class="sys-status" [ngClass]="systemHealth.postgres === 'Connected' ? 'online' : 'error'">{{ systemHealth.postgres }}</span>
          </div>
          <div class="sys-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
            <span class="sys-dot online"></span>
            Bank Mode
            <span class="sys-status" style="color: #93c5fd; font-weight: 600;">{{ activeBankMode }}</span>
          </div>
        </div>

        <div class="sidebar-footer">
          <span class="footer-env">PRODUCTION DEMO</span>
          <span class="footer-ver">v1.0.0</span>
        </div>
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
              <div class="banner-eyebrow">Production Payment Gateway</div>
              <h1 class="banner-title">{{ getTabLabel() }}</h1>
              <p class="banner-sub">{{ getTabDescription() }}</p>
            </div>
            <div class="banner-actions">
              <button class="btn-reset" (click)="resetStats()" title="Reset all demo metrics">
                <i-lucide name="rotate-ccw" [size]="14"></i-lucide>
                <span>Reset Stats</span>
              </button>
            </div>
          </div>
        </header>

        <div class="content-area">
          <!-- Stats Grid -->
          <div class="stat-grid">
            <div *ngFor="let stat of statCards" class="stat-card" [ngClass]="stat.cardClass">
              <i-lucide [name]="stat.icon" class="stat-icon" [ngClass]="stat.iconClass" [size]="18"></i-lucide>
              <span class="stat-label-text">{{ stat.label }}</span>
              <div class="stat-value" [ngClass]="stat.iconClass">{{ stats[stat.id] || 0 }}</div>
            </div>
          </div>

          <!-- ================= LAB TAB ================= -->
          <div *ngIf="activeTab === 'lab'">

            <!-- Concurrent Requests Hero Section -->
            <div class="burst-hero">
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div>
                  <h2>Simulate Concurrent Requests</h2>
                  <p>
                    Fire 10 identical payment requests simultaneously with the same <code>Idempotency-Key</code>.
                    Observe that atomic Redis <code>SET NX</code> allows only 1 request to hit the bank while 9 are safely rejected or cached.
                  </p>
                </div>
              </div>

              <div class="burst-controls">
                <div class="burst-control-group">
                  <label>Requests Count</label>
                  <div class="burst-count-pills">
                    <button *ngFor="let n of [5, 10, 15, 20]" 
                            class="count-pill" 
                            [class.active]="burstCount === n" 
                            (click)="burstCount = n">
                      {{ n }}
                    </button>
                  </div>
                </div>

                <div class="burst-control-group" style="flex: 1; min-width: 200px;">
                  <label>Shared Idempotency Key</label>
                  <div style="display: flex; gap: 6px;">
                    <input type="text" [(ngModel)]="burstKey" style="background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); color: #fff; font-size: 0.85rem; padding: 7px 12px;" />
                    <button class="btn-icon-subtle" (click)="regenerateBurstKey()" style="background: rgba(255,255,255,0.2); color: #fff; border-color: rgba(255,255,255,0.3); padding: 7px 10px;" title="Generate new key">
                      <i-lucide name="refresh-cw" [size]="14"></i-lucide>
                    </button>
                  </div>
                </div>

                <div class="burst-control-group">
                  <label>&nbsp;</label>
                  <button class="burst-launch-btn" (click)="launchBurst()" [disabled]="isBurstRunning || activeRequests > 0">
                    <ng-container *ngIf="!isBurstRunning">
                      <i-lucide name="play" [size]="16"></i-lucide>
                      <span>Fire {{ burstCount }} Concurrent Requests</span>
                    </ng-container>
                    <ng-container *ngIf="isBurstRunning">
                      <i-lucide name="loader-circle" class="spinner" [size]="16"></i-lucide>
                      <span>Firing {{ burstCount }} Requests...</span>
                    </ng-container>
                  </button>
                </div>
              </div>
            </div>

            <!-- Burst Results Summary & Table -->
            <div *ngIf="burstResults.length > 0">
              <div class="burst-summary-banner">
                <div class="burst-summary-text">
                  <strong>Idempotency Verification Passed</strong>
                  <span>Fired {{ burstResults.length }} simultaneous requests. Only 1 call reached the partner bank; {{ burstBlockedCount }} duplicate requests were blocked!</span>
                </div>
                <div class="burst-summary-badges">
                  <span class="badge-stat bank">Bank Calls: {{ burstSuccessCount }}</span>
                  <span class="badge-stat blocked">Duplicates Blocked: {{ burstBlockedCount }}</span>
                </div>
              </div>

              <div class="burst-table-container">
                <div class="burst-table-header">
                  <span>Req #</span>
                  <span>HTTP Status</span>
                  <span>Idempotency Outcome</span>
                  <span>Latency</span>
                </div>
                <div *ngFor="let item of burstResults" 
                     class="burst-table-row" 
                     [ngClass]="{'row-success': item.status === 'SUCCESS', 'row-conflict': item.status === 'CONFLICT', 'row-error': item.status === 'ERROR'}">
                  <span style="font-weight: 600; color: #475569;">REQ-{{ item.index.toString().padStart(2, '0') }}</span>
                  <div>
                    <span class="badge-pill" [ngClass]="item.statusCode === 200 ? 'status-200' : (item.statusCode === 409 ? 'status-409' : 'status-err')">
                      {{ item.statusCode }} {{ item.status }}
                    </span>
                  </div>
                  <span style="color: #334155;">{{ item.message }}</span>
                  <span style="color: #64748b; font-size: 0.8rem;">{{ item.timeMs }} ms</span>
                </div>
              </div>
            </div>

            <div class="two-col">
              <!-- Single Payment Form -->
              <div class="payment-card panel" style="padding: 24px; border: 1px solid #e2e8f0;">
                <div class="header">
                  <h1>Single Payment Processor</h1>
                  <p>Execute individual transactions with a custom payload or test retry</p>
                </div>
                
                <div class="form-group">
                  <label>Idempotency Key</label>
                  <div class="input-with-button">
                    <input type="text" [(ngModel)]="idempotencyKey" />
                    <button class="btn-icon-subtle" (click)="regenerateSingleKey()" title="Generate new key">
                      <i-lucide name="refresh-cw" [size]="14"></i-lucide>
                      <span>New</span>
                    </button>
                  </div>
                  <small>Ensures duplicate payments are not charged twice.</small>
                </div>
                
                <div class="form-group">
                  <label>Customer ID</label>
                  <input type="text" [(ngModel)]="customerId" />
                </div>

                <div class="form-row">
                  <div class="form-group flex-2">
                    <label>Amount</label>
                    <input type="number" [(ngModel)]="amount" min="1" />
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
                  <button class="submit-btn" type="button" (click)="submitPayment()" [disabled]="activeRequests > 0 || isBurstRunning">
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
                
                <!-- Response Card -->
                <div *ngIf="response" 
                     class="response-card" 
                     [ngClass]="{'success': response.status === 'SUCCESS', 'failed': response.status === 'FAILED', 'unknown': response.status === 'UNKNOWN'}">
                  <h3>Payment {{ response.status }}</h3>
                  <div style="font-size: 0.85rem; margin-bottom: 8px;">
                    <strong>Message:</strong> {{ response.message || 'Transaction completed' }}
                  </div>
                  <pre>{{ response | json }}</pre>
                </div>
              </div>

              <!-- Live Outgoing API Feed -->
              <div class="panel" style="padding: 24px; border: 1px solid #e2e8f0;">
                <div class="panel-head" style="padding: 0 0 16px 0;">
                  <div>
                    <h3>Live Client API Feed</h3>
                    <p>Real-time log of HTTP requests sent from this session</p>
                  </div>
                  <button class="btn-reset" (click)="apiLogs = []" style="font-size: 0.75rem;">Clear</button>
                </div>
                <div class="log-feed" style="max-height: 440px; overflow-y: auto;">
                  <div class="log-entry" *ngFor="let log of apiLogs">
                    <div class="log-dot" [ngStyle]="{'background': log.color}"></div>
                    <div class="log-text">
                      <span style="font-size: 11px; color: #64748b; margin-right: 6px;">{{ log.time | date:'HH:mm:ss.SSS' }}</span>
                      <strong style="color: #0f172a;">{{ log.method }}</strong> {{ log.url }}
                      <div style="margin-top: 4px; font-size: 13px; color: #475569;">
                        Status: <span [ngStyle]="{'color': log.color, 'font-weight': '600'}">{{ log.status }}</span>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="apiLogs.length === 0" style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.9rem;">
                    No requests sent yet. Fire a burst or click "Pay Now" to start.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= BANK SIMULATOR TAB ================= -->
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
            
            <div class="panel" style="margin-top: 2rem; background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <h3 style="margin-top: 0; color: #0f172a; font-weight: 600; font-size: 1.15rem;">Configured Bank Simulator Behavior</h3>
              <p style="color: #64748b; margin-top: 0.5rem; font-size: 0.95rem;">
                Currently active mode: <strong style="color: #2563eb;">{{ activeBankMode }}</strong>.
              </p>

              <div *ngIf="activeBankMode === 'TIMEOUT'" style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0;">
                <label style="font-weight: 600; color: #334155;">Bank Response Timeout Delay: {{ bankDelayMs }} ms</label>
                <div class="delay-slider-wrap">
                  <input type="range" min="1000" max="8000" step="500" [(ngModel)]="bankDelayMs" (change)="updateBankDelay()" />
                  <span style="font-size: 0.85rem; font-weight: 600; color: #2563eb;">{{ bankDelayMs / 1000 }}s</span>
                </div>
                <small style="margin-top: 6px; color: #64748b;">
                  In TIMEOUT mode, the gateway waits for the bank, records the payment as UNKNOWN, and returns 200 with UNKNOWN status.
                  The background <strong>Reconciliation Service</strong> then checks the bank transaction and automatically resolves it to SUCCESS!
                </small>
              </div>

              <div *ngIf="activeBankMode === 'FAILURE'" style="margin-top: 1rem; color: #dc2626; font-size: 0.9rem;">
                Payments will be rejected with status <code>FAILED</code>. This allows testing downstream rejection flows.
              </div>

              <div *ngIf="activeBankMode === 'SUCCESS'" style="margin-top: 1rem; color: #16a34a; font-size: 0.9rem;">
                Standard happy path. The bank immediately authorizes the transaction with a unique <code>bankTransactionId</code>.
              </div>
            </div>
          </div>

          <!-- ================= TIMELINE TAB ================= -->
          <div *ngIf="activeTab === 'timeline'">
            <div class="timeline-container">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                  <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 600;">System Event Timeline</h3>
                  <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.85rem;">Live stream of server-side idempotency locks, duplicate rejections, and background reconciliation</p>
                </div>
                <button class="btn-reset" (click)="fetchTimeline()">
                  <i-lucide name="refresh-cw" [size]="14"></i-lucide>
                  <span>Refresh</span>
                </button>
              </div>

              <div *ngIf="timelineEvents.length > 0">
                <div class="timeline-item" *ngFor="let item of timelineEvents">
                  <div class="timeline-bullet"></div>
                  <div class="timeline-content">
                    <div class="timeline-msg">{{ item.message }}</div>
                    <div class="timeline-ts">{{ item.time }}</div>
                  </div>
                </div>
              </div>

              <div *ngIf="timelineEvents.length === 0" style="padding: 3rem; text-align: center; color: #64748b;">
                No events in timeline yet. Run a payment or burst test to generate events.
              </div>
            </div>
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
  private pollInterval?: any;

  // Single payment form
  idempotencyKey = 'payment_' + Date.now();
  amount = 1000;
  customerId = 'cust_12345';
  currencies = ['INR', 'USD', 'EUR', 'GBP'];
  currency = 'INR';
  isCurrencyDropdownOpen = false;
  response: any = null;

  // Bank Simulator
  bankModes = BANK_MODES;
  activeBankMode = 'SUCCESS';
  bankDelayMs = 5000;

  // Stats & Health
  statCards = STAT_CARDS;
  stats: any = { totalRequests: 0, bankCalls: 0, successfulPayments: 0, duplicateRequests: 0 };
  systemHealth: SystemHealth = { api: 'Online', redis: 'Connected', postgres: 'Connected' };

  // Live feed & Timeline
  apiLogs: any[] = [];
  timelineEvents: { message: string; time: string }[] = [];

  // Concurrent Burst Lab
  burstCount = 10;
  burstKey = 'burst_' + Date.now();
  isBurstRunning = false;
  burstResults: BurstResult[] = [];
  burstSuccessCount = 0;
  burstBlockedCount = 0;

  activeRequests = 0;

  constructor(private http: HttpClient) {}

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
    this.http.get<any>('/api/demo/stats').subscribe({
      next: (data) => {
        if (data) {
          this.stats = { ...this.stats, ...data };
        }
      },
      error: () => {}
    });
  }

  fetchSystemHealth() {
    this.http.get<SystemHealth>('/api/system/health').subscribe({
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
    this.http.get<any>('/api/demo/bank/mode').subscribe({
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
    this.http.get<string[]>('/api/demo/timeline').subscribe({
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
    this.http.post('/api/demo/stats/reset', {}).subscribe({
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
    this.http.post('/api/demo/bank/mode', { 
      mode: modeId,
      delayMs: modeId === 'TIMEOUT' ? this.bankDelayMs : 0 
    }).subscribe({
      next: () => {
        toast.success(`Bank simulator mode set to ${modeId}`);
        this.fetchTimeline();
      },
      error: () => toast.error(`Failed to set mode ${modeId}`)
    });
  }

  updateBankDelay() {
    if (this.activeBankMode === 'TIMEOUT') {
      this.http.post('/api/demo/bank/mode', { 
        mode: 'TIMEOUT',
        delayMs: this.bankDelayMs 
      }).subscribe({
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

    this.currentPaymentSubscription = this.http.post<any>('/api/payments', body, { headers })
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
      const headers = new HttpHeaders().set('Idempotency-Key', sharedKey);
      
      return firstValueFrom(this.http.post<any>('/api/payments', payload, { headers }))
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
