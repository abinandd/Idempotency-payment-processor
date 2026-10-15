export interface BurstResult {
  index: number;
  status: 'SUCCESS' | 'CONFLICT' | 'ERROR';
  statusCode: number;
  message: string;
  timeMs: number;
  data?: any;
}
