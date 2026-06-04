const { httpRequestsTotal, httpRequestDuration } = require('./index');

const metricsMiddleware = (req, res, next) => {
  // Record the exact time the request arrived
  const start = Date.now();

  // When the response finishes, record the metrics
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // convert ms → seconds

    // Normalise the route path so '/api/users/123' and '/api/users/456'
    // don't create thousands of separate metric labels
    // Instead they both become '/api/users/:id'
    const route = req.route ? req.baseUrl + req.route.path : req.path;

    const labels = {
      method:      req.method,
      route:       route,
      status_code: res.statusCode,
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
};

module.exports = metricsMiddleware;