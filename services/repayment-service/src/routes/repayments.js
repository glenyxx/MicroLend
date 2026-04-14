const express = require('express');
const router  = express.Router();
const {
  getSchedule,
  recordPayment,
  getOverdueLoans,
  getAllSchedules,
} = require('../controllers/repaymentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', restrictTo('officer', 'admin'), getAllSchedules);

router.get('/loan/:loanId', getSchedule);

router.get('/overdue', restrictTo('officer', 'admin'), getOverdueLoans);

router.post('/pay', restrictTo('officer', 'admin'), recordPayment);

module.exports = router;