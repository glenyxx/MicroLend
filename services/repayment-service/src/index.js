const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const repaymentRoutes       = require('./routes/repayments');
const { initDB }            = require('./db');
const { startConsumer }     = require('./messaging/consumer');
const { startOverdueChecker } = require('./jobs/overdueChecker');

const app  = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'repayment-service' });
});

app.use('/api/repayments', repaymentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Something went wrong' });
});

const startServer = async () => {
  await initDB();

  // Start the RabbitMQ consumer to listen for new approved loans
  startConsumer();

  // Start the nightly overdue checker cron job
  startOverdueChecker();

  app.listen(PORT, () => {
    console.log(`🚀 Repayment Service running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;