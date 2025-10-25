#!/bin/bash

echo "========================================"
echo "Insurance Automation System - Dev Mode"
echo "========================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $OCR_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start OCR Service
echo "Starting OCR Service..."
cd ocr_service
source venv/bin/activate
uvicorn app:app --reload --port 8000 &
OCR_PID=$!
cd ..

# Wait for OCR service to start
sleep 3

# Start React Frontend
echo "Starting React Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Services Running:"
echo "========================================"
echo "OCR Service: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

# Wait for both processes
wait
