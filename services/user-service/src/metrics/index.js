const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'user_service_',  // prefix so Grafana knows which service it came from
});

//  CUSTOM METRICS 

// Counter: total HTTP requests received, labelled by method, route, status code
// Counters only go up — perfect for totals and rates
const httpRequestsTotal = new client.Counter({
  name:    'user_service_http_requests_total',
  help:    'Total number of HTTP requests received by the user service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Histogram: how long each request takes, in seconds
// Histograms let you calculate percentiles (p50, p95, p99)
// The buckets define the boundaries of each bar in the histogram chart
const httpRequestDuration = new client.Histogram({
  name:    'user_service_http_request_duration_seconds',
  help:    'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Gauge: current number of registered users in the database
// Gauges go up and down — perfect for current counts
const registeredUsersTotal = new client.Gauge({
  name:    'user_service_registered_users_total',
  help:    'Total number of registered users in the platform',
  registers: [register],
});

// Counter: total login attempts, labelled by outcome
const loginAttemptsTotal = new client.Counter({
  name:    'user_service_login_attempts_total',
  help:    'Total login attempts labelled by success or failure',
  labelNames: ['outcome'],   // outcome = 'success' or 'failure'
  registers: [register],
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  registeredUsersTotal,
  loginAttemptsTotal,
};