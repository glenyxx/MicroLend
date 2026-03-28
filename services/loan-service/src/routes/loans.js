const express = require('express');
const router = express.Router();
const {
  applyLoan,
  getLoans,
  getLoanById,
  updateLoanStatus,
} = require('../controllers/loanController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All loan routes require a valid JWT — protect() runs first on every route
router.use(protect);

// Borrowers apply; officers and admins can also apply on behalf of clients
router.post('/apply', restrictTo('borrower', 'officer', 'admin'), applyLoan);

// Get loans — response differs based on role (see controller)
router.get('/', getLoans);

// Get a single loan by its ID
router.get('/:id', getLoanById);

// Only officers and admins can change loan status
router.patch('/:id/status', restrictTo('officer', 'admin'), updateLoanStatus);

module.exports = router;