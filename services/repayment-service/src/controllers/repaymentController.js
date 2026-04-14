const { pool } = require('../db');

// GET SCHEDULE FOR A LOAN 
const getSchedule = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { role, userId } = req.user;

    // Find the schedule
    const schedResult = await pool.query(
      'SELECT * FROM repayment_schedules WHERE loan_id = $1',
      [loanId]
    );

    if (schedResult.rows.length === 0) {
      return res.status(404).json({ error: 'No repayment schedule found for this loan' });
    }

    const schedule = schedResult.rows[0];

    if (role === 'borrower' && schedule.borrower_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all instalments ordered by due date
    const instResult = await pool.query(
      `SELECT * FROM repayment_instalments
       WHERE  loan_id = $1
       ORDER  BY instalment_number ASC`,
      [loanId]
    );

    // Calculate summary statistics
    const instalments   = instResult.rows;
    const totalPaid     = instalments
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.amount_paid), 0);
    const totalRemaining = parseFloat(schedule.total_repayable) - totalPaid;
    const overdueCount  = instalments.filter(i => i.status === 'overdue').length;
    const paidCount     = instalments.filter(i => i.status === 'paid').length;

    res.status(200).json({
      schedule: {
        ...schedule,
        summary: {
          total_paid:      totalPaid,
          total_remaining: totalRemaining,
          paid_count:      paidCount,
          overdue_count:   overdueCount,
          pending_count:   instalments.filter(i => i.status === 'pending').length,
        },
      },
      instalments,
    });

  } catch (err) {
    console.error('getSchedule error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// RECORD A PAYMENT
const recordPayment = async (req, res) => {
  try {
    const { instalment_id, amount_paid, notes } = req.body;

    if (!instalment_id || !amount_paid) {
      return res.status(400).json({ error: 'instalment_id and amount_paid are required' });
    }

    // Find the instalment
    const instResult = await pool.query(
      'SELECT * FROM repayment_instalments WHERE id = $1',
      [instalment_id]
    );

    if (instResult.rows.length === 0) {
      return res.status(404).json({ error: 'Instalment not found' });
    }

    const instalment = instResult.rows[0];

    if (instalment.status === 'paid') {
      return res.status(400).json({ error: 'This instalment has already been paid' });
    }

    const paid = parseFloat(amount_paid);

    const newStatus = paid >= parseFloat(instalment.amount_due) ? 'paid' : 'pending';

    const updated = await pool.query(
      `UPDATE repayment_instalments
       SET    amount_paid = $1,
              status      = $2,
              paid_at     = $3,
              notes       = $4
       WHERE  id = $5
       RETURNING *`,
      [
        paid,
        newStatus,
        newStatus === 'paid' ? new Date().toISOString() : null,
        notes || null,
        instalment_id,
      ]
    );

    if (newStatus === 'paid') {
      const remaining = await pool.query(
        `SELECT COUNT(*) FROM repayment_instalments
         WHERE  loan_id = $1 AND status != 'paid'`,
        [instalment.loan_id]
      );

      if (parseInt(remaining.rows[0].count) === 0) {
        await pool.query(
          `UPDATE repayment_schedules SET status = 'completed'
           WHERE loan_id = $1`,
          [instalment.loan_id]
        );
        console.log(`🎉 Loan #${instalment.loan_id} fully repaid!`);
      }
    }

    res.status(200).json({
      message: newStatus === 'paid'
        ? '✅ Payment recorded — instalment marked as paid'
        : '⚠️  Partial payment recorded — instalment still pending',
      instalment: updated.rows[0],
    });

  } catch (err) {
    console.error('recordPayment error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET ALL OVERDUE LOANS 
// Officers and admins use this to chase up late borrowers
const getOverdueLoans = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        rs.loan_id,
        rs.borrower_name,
        rs.borrower_email,
        rs.monthly_instalment,
        COUNT(ri.id)                          AS overdue_count,
        SUM(ri.amount_due - ri.amount_paid)   AS total_overdue_amount,
        MIN(ri.due_date)                      AS earliest_overdue_date
      FROM   repayment_schedules   rs
      JOIN   repayment_instalments ri ON ri.loan_id = rs.loan_id
      WHERE  ri.status = 'overdue'
      GROUP  BY rs.loan_id, rs.borrower_name,
                rs.borrower_email, rs.monthly_instalment
      ORDER  BY total_overdue_amount DESC
    `);

    res.status(200).json({
      count:        result.rows.length,
      overdue_loans: result.rows,
    });

  } catch (err) {
    console.error('getOverdueLoans error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET ALL SCHEDULES (admin summary) 
const getAllSchedules = async (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM repayment_schedules';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ count: result.rows.length, schedules: result.rows });

  } catch (err) {
    console.error('getAllSchedules error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getSchedule, recordPayment, getOverdueLoans, getAllSchedules };