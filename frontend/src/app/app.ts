import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 2rem 1rem;
    }
    .payment-card {
      font-family: 'Poppins', sans-serif;
      max-width: 480px;
      margin: 2rem auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border: 1px solid #f3f4f6;
      padding: 2.5rem 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .header p {
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 0.5rem;
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
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #fff;
    }
    input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    /* Custom Dropdown Styles */
    .custom-select {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      background: #fff;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: border-color 0.2s, box-shadow 0.2s;
      user-select: none;
    }
    .custom-select.open {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .custom-select .chevron-icon {
      transition: transform 0.2s;
    }
    .custom-select.open .chevron-icon {
      transform: rotate(180deg);
    }
    .custom-options {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 10;
      overflow: hidden;
    }
    .custom-option {
      padding: 0.75rem 1rem;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.1s;
    }
    .custom-option:hover {
      background: #f3f4f6;
    }
    .custom-option.selected {
      background: #eef2ff;
      color: #4f46e5;
      font-weight: 500;
    }

    small {
      color: #9ca3af;
      font-size: 0.75rem;
      display: block;
      margin-top: 0.4rem;
    }
    .submit-btn {
      width: 100%;
      margin-top: 1rem;
      background: #111827;
      color: #fff;
      padding: 0.85rem;
      border: none;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    .submit-btn:hover {
      background: #1f2937;
    }
    .submit-btn:active {
      transform: translateY(1px);
    }
    .response-card {
      margin-top: 2rem;
      padding: 1.25rem;
      border-radius: 12px;
    }
    .response-card.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .response-card.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    .response-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }
    .response-card.success h3 { color: #166534; }
    .response-card.error h3 { color: #991b1b; }
    .response-card pre {
      margin: 0;
      font-size: 0.85rem;
      overflow-x: auto;
    }
    .response-card.success pre { color: #15803d; }
    .response-card.error pre { color: #b91c1c; }
  `],
  template: `
    <div class="payment-card" (click)="isCurrencyDropdownOpen = false">
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

      <div *ngIf="error" class="response-card error">
        <h3>Payment Failed</h3>
        <pre>{{ error | json }}</pre>
      </div>
    </div>
  `
})
export class AppComponent {
  idempotencyKey = 'payment_' + Date.now();
  amount = 1000;
  customerId = 'cust_12345';
  
  currencies = ['INR', 'USD', 'EUR', 'GBP'];
  currency = 'INR';
  isCurrencyDropdownOpen = false;

  response: any = null;
  error: any = null;

  constructor(private http: HttpClient) {}

  selectCurrency(c: string) {
    this.currency = c;
    this.isCurrencyDropdownOpen = false;
  }

  submitPayment() {
    this.response = null;
    this.error = null;
    const headers = new HttpHeaders().set('Idempotency-Key', this.idempotencyKey);
    const body = {
      customerId: this.customerId,
      amount: this.amount,
      currency: this.currency
    };

    this.http.post('/api/payments', body, { headers })
      .pipe(catchError((err: HttpErrorResponse) => {
        this.error = err.error || err.message;
        return throwError(() => err);
      }))
      .subscribe(res => {
        this.response = res;
      });
  }
}
