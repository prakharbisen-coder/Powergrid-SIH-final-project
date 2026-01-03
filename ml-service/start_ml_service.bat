@echo off
echo Starting Power Grid ML Service...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the service
echo ML Service will start at http://localhost:8000
echo Press Ctrl+C to stop the service
echo.

uvicorn main:app --reload --host 0.0.0.0 --port 8000
