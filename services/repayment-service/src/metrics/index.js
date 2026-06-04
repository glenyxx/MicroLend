const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register, prefix: 'repayment_service_' });

const httpRequestsTotal = new client.Counter({
  name: 'repayment_service_http_requests_total',
  help: 'Total HTTP requests to the repayment service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name:    'repayment_service_http_request_duration_seconds',
  help:    'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Gauge — how many repayment schedules are currently active
const activeSchedules = new client.Gauge({
  name:      'repayment_service_active_schedules_total',
  help:      'Number of currently active repayment schedules',
  registers: [register],
});

// Gauge — how many instalments are currently overdue across all loans
const overdueInstalments = new client.Gauge({
  name:      'repayment_service_overdue_instalments_total',
  help:      'Number of overdue instalments across all loans',
  registers: [register],
});

// Counter — total payments recorded
const paymentsRecorded = new client.Counter({
  name:      'repayment_service_payments_recorded_total',
  help:      'Total number of repayment payments recorded',
  registers: [register],
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeSchedules,
  overdueInstalments,
  paymentsRecorded,
};