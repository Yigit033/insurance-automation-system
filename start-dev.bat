@echo off
echo ========================================
echo Insurance Automation System - Dev Mode
echo ========================================
echo.

echo Starting OCR Service...
start "OCR Service" cmd /k "cd ocr_service && venv\Scripts\activate && uvicorn app:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting React Frontend...
start "React Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo OCR Service: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WindowTitle eq OCR Service*" /T /F
taskkill /FI "WindowTitle eq React Frontend*" /T /F
