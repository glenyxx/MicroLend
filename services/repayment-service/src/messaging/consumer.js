const amqp = require('amqplib');
const { pool } = require('../db');
const { generateSchedule } = require('../utils/scheduleGenerator');
require('dotenv').config();

const EXCHANGE_NAME = 'microlend_events';
const QUEUE_NAME    = 'repayment_schedule_queue';
const ROUTING_KEY   = 'loan.approved';

const createScheduleFromEvent = async (loanData) => {
  const existing = await pool.query(
    'SELECT id FROM repayment_schedules WHERE loan_id = $1',
    [loanData.loanId]
  );

  if (existing.rows.length > 0) {
    console.log(`⚠️  Schedule already exists for loan #${loanData.loanId} — skipping`);
    return;
  }

  const schedule = generateSchedule(loanData);

  const scheduleResult = await pool.query(
    `INSERT INTO repayment_schedules
       (loan_id, borrower_id, borrower_email, borrower_name,
        principal_amount, interest_rate, duration_months,
        monthly_instalment, total_repayable, total_interest)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      schedule.loan_id,
      schedule.borrower_id,
      schedule.borrower_email,
      schedule.borrower_name,
      schedule.principal_amount,
      schedule.interest_rate,
      schedule.duration_months,
      schedule.monthly_instalment,
      schedule.total_repayable,
      schedule.total_interest,
    ]
  );

  const scheduleId = scheduleResult.rows[0].id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const inst of schedule.instalments) {
      await client.query(
        `INSERT INTO repayment_instalments
           (schedule_id, loan_id, instalment_number, due_date, amount_due)
         VALUES ($1, $2, $3, $4, $5)`,
        [scheduleId, schedule.loan_id, inst.instalment_number,
         inst.due_date, inst.amount_due]
      );
    }

    await client.query('COMMIT');

    console.log(`\n✅ Repayment schedule created for loan #${loanData.loanId}`);
    console.log(`   Borrower   : ${schedule.borrower_name}`);
    console.log(`   Principal  : ${schedule.principal_amount.toLocaleString()} XAF`);
    console.log(`   Monthly    : ${schedule.monthly_instalment.toLocaleString()} XAF`);
    console.log(`   Total due  : ${schedule.total_repayable.toLocaleString()} XAF`);
    console.log(`   Instalments: ${schedule.duration_months}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed, rolled back:', err.message);
  } finally {
    client.release();
  }
};

const startConsumer = async () => {
  while (true) {
    try {
      console.log('🔌 Repayment consumer connecting to RabbitMQ...');
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel    = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);
      channel.basicQos = 1;

      channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`\n📩 loan.approved received — Loan #${event.loanId}`);
          await createScheduleFromEvent(event);
          channel.ack(msg);
        } catch (err) {
          console.error('❌ Failed to process event:', err.message);
          channel.nack(msg, false, true);
        }
      });

      console.log(`✅ Repayment consumer listening for '${ROUTING_KEY}' events`);
      // Keep the process alive
      await new Promise(() => {});

    } catch (err) {
      console.error('RabbitMQ connection failed — retrying in 5s:', err.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = { startConsumer };