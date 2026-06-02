#!/bin/sh
echo "Starting Credit Service..."

# Start the RabbitMQ consumer in the background (&)
python consumer.py &

# Start the Flask API in the foreground
python app.py