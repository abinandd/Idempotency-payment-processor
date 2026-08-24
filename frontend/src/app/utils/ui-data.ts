export const SIDEBAR_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'layout', description: 'Live metrics and pipeline health' },
  { id: 'lab', label: 'Idempotency Lab', icon: 'zap', description: 'Fire concurrent duplicate requests' },
  { id: 'bank', label: 'Bank Simulator', icon: 'landmark', description: 'Switch provider behaviour instantly' },
  { id: 'timeline', label: 'Event Timeline', icon: 'list', description: 'Review a compact event feed' }
] as const;

export const PIPELINE_STEPS = [
  { label: 'Request received', icon: 'send', colorClass: 'text-accent', description: 'The API accepts a payment request with its idempotency key.' },
  { label: 'Idempotency check', icon: 'shield', colorClass: 'text-accent', description: 'The engine checks whether the key is already in flight or resolved.' },
  { label: 'Redis lock', icon: 'database', colorClass: 'text-danger', description: 'The first request claims the key and blocks concurrent duplicates.' },
  { label: 'Bank processing', icon: 'landmark', colorClass: 'text-warning', description: 'The simulated provider approves, rejects, or times out the call.' },
  { label: 'Database commit', icon: 'database', colorClass: 'text-success', description: 'A successful run persists the final payment outcome.' }
] as const;

export const BANK_MODES = [
  { 
    id: 'SUCCESS', 
    label: 'SUCCESS', 
    icon: 'check-circle', 
    colorClass: 'text-success',
    description: 'Bank approves the transaction and returns a committed payment result.' 
  }, 
  { 
    id: 'FAILURE', 
    label: 'FAILURE', 
    icon: 'x-circle', 
    colorClass: 'text-danger',
    description: 'Bank rejects the transaction so you can observe a hard failure path.' 
  }, 
  { 
    id: 'TIMEOUT', 
    label: 'TIMEOUT', 
    icon: 'clock', 
    colorClass: 'text-warning',
    description: 'Bank stays silent long enough for the gateway to mark the request unknown.' 
  }
] as const;

export const STAT_CARDS = [
  { id: 'totalRequests', label: 'Total Requests', icon: 'activity', iconClass: 'text-muted', cardClass: '', description: 'Every payment attempt reaching the API' },
  { id: 'bankCalls', label: 'Actual Bank Calls', icon: 'landmark', iconClass: 'text-muted', cardClass: '', description: 'Only the first request for each key should pass through' },
  { id: 'successfulPayments', label: 'Successful Payments', icon: 'check-circle', iconClass: 'text-success', cardClass: 'success-card', description: 'Payments that completed and were committed' },
  { id: 'duplicateRequests', label: 'Duplicates Blocked', icon: 'shield', iconClass: 'text-accent', cardClass: 'safe-card', description: 'Requests stopped before they reached the bank' }
] as const;
