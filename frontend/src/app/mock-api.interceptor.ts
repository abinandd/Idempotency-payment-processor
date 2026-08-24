import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

// In-memory state to mock the backend
let stats = {
  totalRequests: 0,
  successfulPayments: 0,
  duplicateRequests: 0,
  bankCalls: 0
};

let bankMode = 'SUCCESS';
let bankDelayMs = 0;

// Simulate Redis lock & storage: Map of Idempotency-Key to payment state
const idempotencyStore = new Map<string, any>();

export const mockApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  if (req.url.startsWith('/api/demo/stats') && req.method === 'GET') {
    return of(new HttpResponse({ status: 200, body: stats }));
  }

  if (req.url.startsWith('/api/demo/bank/mode') && req.method === 'POST') {
    const body: any = req.body;
    bankMode = body.mode;
    bankDelayMs = body.delayMs || (bankMode === 'TIMEOUT' ? 5000 : 0);
    return of(new HttpResponse({ status: 200, body: { status: 'Mode updated' } }));
  }

  if (req.url.startsWith('/api/payments') && req.method === 'POST') {
    stats.totalRequests++;
    
    const idempotencyKey = req.headers.get('Idempotency-Key');
    
    if (!idempotencyKey) {
      return throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request', error: 'Missing Idempotency-Key' }));
    }

    const existingRecord = idempotencyStore.get(idempotencyKey);

    if (existingRecord) {
      if (existingRecord.status === 'PROCESSING') {
        stats.duplicateRequests++;
        return throwError(() => new HttpErrorResponse({ 
          status: 409, 
          statusText: 'Conflict', 
          error: { message: 'A request with this key is currently being processed.' } 
        }));
      } else if (existingRecord.status === 'SUCCESS') {
        stats.duplicateRequests++;
        return of(new HttpResponse({ status: 200, body: existingRecord.data }));
      } else {
        // If it failed previously, return conflict
        stats.duplicateRequests++;
        return throwError(() => new HttpErrorResponse({ 
          status: 409, 
          statusText: 'Conflict', 
          error: { message: 'Previous request failed or is unknown.' } 
        }));
      }
    }

    // New Request (SET NX equivalent)
    idempotencyStore.set(idempotencyKey, { status: 'PROCESSING' });
    stats.bankCalls++;

    return new Observable<HttpEvent<any>>(observer => {
      setTimeout(() => {
        if (bankMode === 'SUCCESS') {
          stats.successfulPayments++;
          const responseData = { id: Math.random().toString(36).substr(2, 9), status: 'COMPLETED' };
          idempotencyStore.set(idempotencyKey, { status: 'SUCCESS', data: responseData });
          observer.next(new HttpResponse({ status: 200, body: responseData }));
          observer.complete();
        } else if (bankMode === 'FAILURE') {
          idempotencyStore.set(idempotencyKey, { status: 'FAILED' });
          observer.error(new HttpErrorResponse({ status: 400, error: { message: 'Bank Rejected' } }));
        } else if (bankMode === 'TIMEOUT') {
          idempotencyStore.set(idempotencyKey, { status: 'UNKNOWN' });
          observer.error(new HttpErrorResponse({ status: 504, error: { message: 'Gateway Timeout' } }));
        }
      }, bankDelayMs > 0 ? bankDelayMs : 500); // add a tiny delay for realism
    });
  }

  // Pass through if not mocked
  return next(req);
};
