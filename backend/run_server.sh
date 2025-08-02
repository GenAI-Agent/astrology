#!/bin/bash

# Activate virtual environment
source .venv/bin/activate

# Set environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Run the Quart server
echo "Starting Trading Agent Server on port 8002..."
python quart_server.py