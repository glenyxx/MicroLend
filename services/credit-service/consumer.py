import pika
import json
import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL  = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')
CREDIT_API    = 'http://localhost:3003/api/credit/score'
EXCHANGE_NAME = 'microlend_events'
QUEUE_NAME    = 'credit_scoring_queue'
ROUTING_KEY   = 'loan.applied'


def score_loan(loan_data: dict):
    """
    Call the Flask scoring API with the loan data from the event.
    In a production system you would also write the score back
    to the loans database. For now we log it clearly.
    """
    payload = {
        'monthly_income':    loan_data.get('monthly_income', 200000),
        'debt_monthly':      loan_data.get('debt_monthly', 30000),
        'loan_amount':       float(loan_data.get('amount', 500000)),
        'years_in_business': loan_data.get('years_in_business', 2),
        'duration_months':   loan_data.get('duration_months', 12),
        'sector':            loan_data.get('sector', 0),
    }

    try:
        response = requests.post(CREDIT_API, json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Loan #{loan_data.get('loanId')} scored:")
            print(f"   Borrower    : {loan_data.get('borrowerName')}")
            print(f"   Amount      : {loan_data.get('amount'):,.0f} XAF")
            print(f"   Score       : {result['credit_score']}")
            print(f"   Recommend   : {result['recommendation'].upper()}")
            print(f"   Confidence  : {result['confidence']}")
            print(f"   Top factor  : {result['summary'][0] if result['summary'] else 'N/A'}")
        else:
            print(f"❌ Scoring API returned {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not reach Credit API — is it running?")


def on_message(channel, method, properties, body):
    """Called every time a message arrives in the queue."""
    try:
        event = json.loads(body)
        print(f"\n📩 Received event: loan.applied — Loan ID {event.get('loanId')}")
        score_loan(event)
        # Acknowledge the message — tell RabbitMQ we processed it successfully
        # Without this, RabbitMQ will re-deliver the message if the consumer crashes
        channel.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        # Reject and requeue — let another consumer try
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_consumer():
    """Connect to RabbitMQ and start listening."""
    while True:
        try:
            print("🔌 Connecting to RabbitMQ...")
            params     = pika.URLParameters(RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel    = connection.channel()

            channel.exchange_declare(
                exchange=EXCHANGE_NAME,
                exchange_type='topic',
                durable=True
            )

            # Create a durable queue
            channel.queue_declare(queue=QUEUE_NAME, durable=True)

            # Bind the queue to the exchange with our routing key
            channel.queue_bind(
                exchange=EXCHANGE_NAME,
                queue=QUEUE_NAME,
                routing_key=ROUTING_KEY
            )

            # Only fetch one message at a time 
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message)

            print(f"✅ Listening for '{ROUTING_KEY}' events on queue '{QUEUE_NAME}'")
            print("   Press Ctrl+C to stop\n")
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError:
            print("❌ RabbitMQ not available — retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nConsumer stopped.")
            break


if __name__ == '__main__':
    start_consumer()