# PowerGrid - Start All Services
# This script starts MongoDB, Backend API, ML Service, and Frontend

Write-Host "Starting PowerGrid Application..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "[1/4] Checking MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "   [OK] MongoDB is already running (PID: $($mongoProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] MongoDB is not running!" -ForegroundColor Red
    Write-Host "   Please start MongoDB first by running: mongod" -ForegroundColor Yellow
    Write-Host "   Or run it as a Windows service" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway or Ctrl+C to exit"
}
Write-Host ""

# Start Backend API
Write-Host "[2/4] Starting Backend API (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Backend API Server' -ForegroundColor Blue; Write-Host '===================' -ForegroundColor Blue; node server.js"
Start-Sleep -Seconds 3
Write-Host "   [OK] Backend API started" -ForegroundColor Green
Write-Host ""

# Start ML Service
Write-Host "[3/4] Starting ML Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ml-service'; Write-Host 'ML Service' -ForegroundColor Magenta; Write-Host '===================' -ForegroundColor Magenta; .\venv\Scripts\activate; python main.py"
Start-Sleep -Seconds 3
Write-Host "   [OK] ML Service started" -ForegroundColor Green
Write-Host ""

# Start Optimization Service
Write-Host "[4/5] Starting Optimization Service (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\optimization-service'; Write-Host 'Optimization Service' -ForegroundColor Green; Write-Host '===================' -ForegroundColor Green; python main.py"
Start-Sleep -Seconds 3
Write-Host "   [OK] Optimization Service started" -ForegroundColor Green
Write-Host ""

# Start Frontend
Write-Host "[5/5] Starting Frontend (Port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Dev Server' -ForegroundColor Cyan; Write-Host '===================' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 3
Write-Host "   [OK] Frontend started" -ForegroundColor Green
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:      http://localhost:8081" -ForegroundColor Cyan
Write-Host "   Backend:       http://localhost:5000" -ForegroundColor Blue
Write-Host "   ML Service:    http://localhost:8000" -ForegroundColor Magenta
Write-Host "   Optimization:  http://localhost:8001" -ForegroundColor Green
Write-Host "   MongoDB:       mongodb://localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "   Admin: admin@powergrid.com / admin123" -ForegroundColor White
Write-Host "   User:  john@powergrid.com / user123" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:8081"
Write-Host ""
Write-Host "[SUCCESS] Browser opened! You can now login." -ForegroundColor Green
Write-Host ""
Write-Host "TIP: Keep this window open to see the status." -ForegroundColor Cyan
Write-Host "To stop all services, run: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
