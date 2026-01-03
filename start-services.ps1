# PowerGrid Services Startup Script
Write-Host "🚀 Starting PowerGrid Services..." -ForegroundColor Cyan

# Kill any existing processes on required ports
Write-Host "`n📌 Checking for existing processes..." -ForegroundColor Yellow
$ports = @(5000, 8000, 8082)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "   Stopping process on port $port..." -ForegroundColor Gray
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}

# Start ML Service (Python FastAPI on port 8000)
Write-Host "`n🤖 Starting ML Service (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'ml-service'; .\venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 3

# Start Backend (Node.js/Express on port 5000)
Write-Host "🔧 Starting Backend Service (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; node server.js"
Start-Sleep -Seconds 2

# Start Frontend (Vite React on port 8081/8082)
Write-Host "🎨 Starting Frontend (Vite Dev Server)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 3

Write-Host "`n✅ All services started!" -ForegroundColor Cyan
Write-Host "`n📊 Service URLs:" -ForegroundColor White
Write-Host "   - Frontend:  http://localhost:8082" -ForegroundColor Cyan
Write-Host "   - Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "   - ML Service: http://localhost:8000" -ForegroundColor Cyan
Write-Host "`n🧪 Test Simulation:" -ForegroundColor White
Write-Host "   - Open: http://localhost:8082/scenarios" -ForegroundColor Yellow
Write-Host "   - Adjust sliders and click 'Run Simulation'" -ForegroundColor Yellow
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
