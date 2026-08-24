export const SIDEBAR_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'layout' },
  { id: 'lab', label: 'Idempotency Lab', icon: 'zap' },
  { id: 'bank', label: 'Bank Simulator', icon: 'landmark' },
  { id: 'timeline', label: 'Event Timeline', icon: 'list' }
];

export const PIPELINE_STEPS = [
  { label: 'Request<br>Received', icon: 'send', colorClass: 'text-accent' },
  { label: 'Idempotency<br>Check', icon: 'shield', colorClass: 'text-accent' },
  { label: 'Redis<br>Lock', icon: 'database', colorClass: 'text-danger' },
  { label: 'Bank<br>Processing', icon: 'landmark', colorClass: 'text-warning' },
  { label: 'Database<br>Commit', icon: 'database', colorClass: 'text-success' }
];

export const BANK_MODES = [
  { 
    id: 'SUCCESS', 
    label: 'SUCCESS', 
    icon: 'check-circle', 
    colorClass: 'text-success',
    description: 'Bank approves the transaction normally.' 
  },
  { 
    id: 'FAILURE', 
    label: 'FAILURE', 
    icon: 'x-circle', 
    colorClass: 'text-danger',
    description: 'Bank rejects the transaction.' 
  },
  { 
    id: 'TIMEOUT', 
    label: 'TIMEOUT', 
    icon: 'clock', 
    colorClass: 'text-warning',
    description: 'Bank does not respond. Status unknown.' 
  }
];

export const STAT_CARDS = [
  { id: 'totalRequests', label: 'Total Requests', icon: 'activity', iconClass: 'text-muted', cardClass: '' },
  { id: 'bankCalls', label: 'Actual Bank Calls', icon: 'landmark', iconClass: 'text-muted', cardClass: '' },
  { id: 'successfulPayments', label: 'Successful Payments', icon: 'check-circle', iconClass: 'text-success', cardClass: 'success-card' },
  { id: 'duplicateRequests', label: 'Duplicates Blocked', icon: 'shield', iconClass: 'text-accent', cardClass: 'safe-card' }
];
