export interface DemoStats {
  totalRequests: number;
  bankCalls: number;
  successfulPayments: number;
  duplicateRequests: number;
  [key: string]: number;
}

export interface BankModeState {
  mode?: string;
  timeoutMs?: number;
}

export interface ApiLogEntry {
  time: Date;
  method: string;
  url: string;
  status: string;
  color: string;
}

export interface TimelineEvent {
  message: string;
  time: string;
}
