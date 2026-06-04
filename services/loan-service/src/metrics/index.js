const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'loan_service_',
});

const httpRequestsTotal = new client.Counter({
  name:       'loan_service_http_requests_total',
  help:       'Total HTTP requests to the loan service',
  labelNames: ['method', 'route', 'status_code'],
  registers:  [register],
});

const httpRequestDuration = new client.Histogram({
  name:       'loan_service_http_request_duration_seconds',
  help:       'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets:    [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers:  [register],
});

// Gauge per loan status — tells you at a glance how many loans
// are in each stage of the pipeline right now
const loansGaugeByStatus = new client.Gauge({
  name:       'loan_service_loans_by_status',
  help:       'Current number of loans in each status',
  labelNames: ['status'],
  registers:  [register],
});

// Counter — total loan applications ever submitted
const loanApplicationsTotal = new client.Counter({
  name:      'loan_service_applications_total',
  help:      'Total loan applications submitted',
  registers: [register],
});

// Counter — total approvals and rejections
const loanDecisionsTotal = new client.Counter({
  name:       'loan_service_decisions_total',
  help:       'Total loan approval and rejection decisions',
  labelNames: ['decision'],   // 'approved' or 'rejected'
  registers:  [register],
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  loansGaugeByStatus,
  loanApplicationsTotal,
  loanDecisionsTotal,
};