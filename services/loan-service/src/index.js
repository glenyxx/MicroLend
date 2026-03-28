const express = require('express');
const cors = require('cors');
require('dotenv').config();

const loanRoutes = require('./routes/loans');
const { initDB } = require('./db');
const { connect: connectRabbitMQ } = require('./messaging/publisher');

const app = express();
const PORT = process.env.PORT || 3002;

//MIDDLEWARE 
app.use(cors());
app.use(express.json());

//HEALTH CHECK 
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'loan-service' });
});

//ROUTES 
app.use('/api/loans', loanRoutes);

//GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Something went wrong' });
});

//START
const startServer = async () => {
  await initDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Loan Service running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;