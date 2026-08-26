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
  template: `
    <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto;">
      <h1>Realistic Payment API Demo</h1>
      <div style="background: #f4f4f5; padding: 1rem; border-radius: 8px;">
        <h3>Process a Payment</h3>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem;">Idempotency Key:</label>
          <input type="text" [(ngModel)]="idempotencyKey" style="width: 100%; padding: 0.5rem;" />
          <small>Change the key to make a new payment. Keep the key to test idempotency (duplicate prevention).</small>
        </div>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem;">Amount (INR):</label>
          <input type="number" [(ngModel)]="amount" style="width: 100%; padding: 0.5rem;" />
        </div>
        <button (click)="submitPayment()" style="background: #000; color: #fff; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
          Submit Payment
        </button>
      </div>
      
      <div *ngIf="response" style="margin-top: 1rem; padding: 1rem; background: #e0f2fe; border-radius: 8px;">
        <h3>API Response:</h3>
        <pre>{{ response | json }}</pre>
      </div>

      <div *ngIf="error" style="margin-top: 1rem; padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 8px;">
        <h3>API Error:</h3>
        <pre>{{ error | json }}</pre>
      </div>
    </div>
  `
})
export class AppComponent {
  idempotencyKey = 'payment_' + Date.now();
  amount = 1000;
  response: any = null;
  error: any = null;

  constructor(private http: HttpClient) {}

  submitPayment() {
    this.response = null;
    this.error = null;
    const headers = new HttpHeaders().set('Idempotency-Key', this.idempotencyKey);
    const body = {
      customerId: 'cust_12345',
      amount: this.amount,
      currency: 'INR'
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
