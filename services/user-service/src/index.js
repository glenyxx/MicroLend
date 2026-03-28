const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

//MIDDLEWARE 
app.use(cors());                        
app.use(express.json());                

//HEALTH CHECK 
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

//ROUTES 
app.use('/api/users', authRoutes);

//ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Something went wrong' });
});

//START SERVER 
const startServer = async () => {
  await initDB();           
  app.listen(PORT, () => {
    console.log(`User Service running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app; 