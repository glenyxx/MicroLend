const amqp = require('amqplib');
require('dotenv').config();

let channel = null;

// Connect to RabbitMQ and create a channel
const connect = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange('microlend_events', 'topic', { durable: true });

    console.log('Connected to RabbitMQ');

    // Handle unexpected disconnections
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      channel = null;
    });

  } catch (err) {
    console.error('RabbitMQ connection failed:', err.message);
    // Retry after 5 seconds — RabbitMQ might still be starting up
    setTimeout(connect, 5000);
  }
};

// Publish an event to the exchange
// routingKey examples: 'loan.applied', 'loan.approved', 'loan.rejected'
const publish = (routingKey, data) => {
  if (!channel) {
    console.warn('RabbitMQ channel not ready — event not published:', routingKey);
    return;
  }
  const message = Buffer.from(JSON.stringify(data));
  channel.publish('microlend_events', routingKey, message, { persistent: true });
  console.log(`📨 Event published: ${routingKey}`, data);
};

module.exports = { connect, publish };