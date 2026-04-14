const cron = require('node-cron');
const { pool } = require('../db');

const checkOverdueInstalments = async () => {
  console.log('\n⏰ Running overdue check...');

  try {
    const result = await pool.query(`
      UPDATE repayment_instalments
      SET    status = 'overdue'
      WHERE  status  = 'pending'
        AND  due_date < CURRENT_DATE
      RETURNING id, loan_id, due_date, amount_due
    `);

    if (result.rowCount === 0) {
      console.log('   No new overdue instalments found');
    } else {
      console.log(`   ⚠️  Marked ${result.rowCount} instalment(s) as overdue:`);
      result.rows.forEach(row => {
        console.log(`      Loan #${row.loan_id} — due ${row.due_date} — ${parseFloat(row.amount_due).toLocaleString()} XAF`);
      });

      await pool.query(`
        UPDATE repayment_schedules
        SET    status = 'overdue'
        WHERE  status = 'active'
          AND  loan_id IN (
            SELECT DISTINCT loan_id
            FROM   repayment_instalments
            WHERE  status = 'overdue'
          )
      `);
    }
  } catch (err) {
    console.error('❌ Overdue check failed:', err.message);
  }
};

const startOverdueChecker = () => {
  cron.schedule('0 0 * * *', checkOverdueInstalments, {
    timezone: 'Africa/Douala',
  });

  console.log('✅ Overdue checker scheduled — runs daily at midnight (WAT)');

  checkOverdueInstalments();
};

module.exports = { startOverdueChecker, checkOverdueInstalments };