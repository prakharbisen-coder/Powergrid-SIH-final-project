@echo off
echo ========================================
echo Power Grid ML Service Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo Step 1: Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo Step 2: Activating virtual environment...
call venv\Scripts\activate.bat

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip

echo Step 4: Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 5: Training initial model...
python train_model.py
if errorlevel 1 (
    echo WARNING: Model training failed, but setup continued
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the ML service, run:
echo   venv\Scripts\activate
echo   python main.py
echo.
echo Or use: start_ml_service.bat
echo.
pause
