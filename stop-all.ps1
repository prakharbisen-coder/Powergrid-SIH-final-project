# PowerGrid - Stop All Services
# This script stops Backend API, ML Service, and Frontend

Write-Host "Stopping PowerGrid Services..." -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# Stop all node processes (Backend + Frontend)
Write-Host "[1/2] Stopping Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   [OK] Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "   [INFO] No Node.js processes running" -ForegroundColor Gray
}
Write-Host ""

# Stop Python processes (ML Service)
Write-Host "[2/2] Stopping Python processes..." -ForegroundColor Yellow
$pythonProcesses = Get-Process python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    $pythonProcesses | Stop-Process -Force
    Write-Host "   [OK] Stopped $($pythonProcesses.Count) Python process(es)" -ForegroundColor Green
} else {
    Write-Host "   [INFO] No Python processes running" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=================================" -ForegroundColor Red
Write-Host "[SUCCESS] All services stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: MongoDB was not stopped. Stop it manually if needed." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
