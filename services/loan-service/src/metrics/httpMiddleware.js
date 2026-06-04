const { httpRequestsTotal, httpRequestDuration } = require('./index');

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route    = req.route ? req.baseUrl + req.route.path : req.path;
    const labels   = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });
  next();
};

module.exports = metricsMiddleware;