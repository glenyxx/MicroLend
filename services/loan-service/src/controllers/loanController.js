const { pool } = require('../db');
const { publish } = require('../messaging/publisher');
require('dotenv').config();

//APPLY FOR A LOAN 
const applyLoan = async (req, res) => {
  try {
    const { amount, purpose, duration_months } = req.body;
    const { userId, full_name, email } = req.user;

    if (!amount || !purpose || !duration_months) {
      return res.status(400).json({
        error: 'amount, purpose and duration_months are required'
      });
    }

    // Business rule: loan amount must be between 50,000 and 5,000,000 XAF
    if (amount < 50000 || amount > 5000000) {
      return res.status(400).json({
        error: 'Loan amount must be between 50,000 and 5,000,000 XAF'
      });
    }

    // Business rule: duration between 1 and 60 months
    if (duration_months < 1 || duration_months > 60) {
      return res.status(400).json({
        error: 'Loan duration must be between 1 and 60 months'
      });
    }

    // Insert the loan — status starts as 'applied' automatically
    const result = await pool.query(
      `INSERT INTO loans
         (borrower_id, borrower_name, borrower_email, amount, purpose, duration_months)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, full_name || 'Unknown', email, amount, purpose, duration_months]
    );

    const loan = result.rows[0];

    // Publish event so the AI Credit Service and Notification Service
    // can react asynchronously without slowing down this response
    publish('loan.applied', {
      loanId:        loan.id,
      borrowerId:    loan.borrower_id,
      borrowerEmail: loan.borrower_email,
      borrowerName:  loan.borrower_name,
      amount:        loan.amount,
      purpose:       loan.purpose,
    });

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan,
    });

  } catch (err) {
    console.error('applyLoan error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//GET ALL LOANS (OFFICERS SEE ALL, BORROWERS SEE THEIR OWN)
const getLoans = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let result;

    if (role === 'borrower') {
      result = await pool.query(
        'SELECT * FROM loans WHERE borrower_id = $1 ORDER BY applied_at DESC',
        [userId]
      );
    } else {
      const { status } = req.query;
      if (status) {
        result = await pool.query(
          'SELECT * FROM loans WHERE status = $1 ORDER BY applied_at DESC',
          [status]
        );
      } else {
        result = await pool.query('SELECT * FROM loans ORDER BY applied_at DESC');
      }
    }

    res.status(200).json({
      count: result.rows.length,
      loans: result.rows,
    });

  } catch (err) {
    console.error('getLoans error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//GET ONE LOAN BY ID 
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    const result = await pool.query('SELECT * FROM loans WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = result.rows[0];

    // Borrowers can only view their own loans
    if (role === 'borrower' && loan.borrower_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ loan });

  } catch (err) {
    console.error('getLoanById error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//UPDATE LOAN STATUS 
const updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, officer_notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }

    // Find the current loan
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1', [id]);
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = loanResult.rows[0];

    // Check if this status transition is valid using the transitions table
    const transitionResult = await pool.query(
      'SELECT * FROM valid_transitions WHERE from_status = $1 AND to_status = $2',
      [loan.status, status]
    );

    if (transitionResult.rows.length === 0) {
      return res.status(400).json({
        error: `Invalid transition: cannot move from '${loan.status}' to '${status}'`
      });
    }

    // Apply the update
    const updated = await pool.query(
      `UPDATE loans
       SET status = $1, officer_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, officer_notes || loan.officer_notes, id]
    );

    const updatedLoan = updated.rows[0];

    // Publish specific events based on the new status
    if (status === 'approved') {
      publish('loan.approved', {
        loanId:        updatedLoan.id,
        borrowerId:    updatedLoan.borrower_id,
        borrowerEmail: updatedLoan.borrower_email,
        borrowerName:  updatedLoan.borrower_name,
        amount:        updatedLoan.amount,
        duration_months: updatedLoan.duration_months,
      });
    }

    if (status === 'rejected') {
      publish('loan.rejected', {
        loanId:        updatedLoan.id,
        borrowerEmail: updatedLoan.borrower_email,
        borrowerName:  updatedLoan.borrower_name,
        officer_notes: updatedLoan.officer_notes,
      });
    }

    res.status(200).json({
      message: `Loan status updated to '${status}'`,
      loan: updatedLoan,
    });

  } catch (err) {
    console.error('updateLoanStatus error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { applyLoan, getLoans, getLoanById, updateLoanStatus };