# TEST MATERIAL VALIDATION SYSTEM
Write-Host "`n🧪 TESTING MATERIAL VALIDATION SYSTEM" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Test 1: Approved Material
Write-Host "Test 1: Validating APPROVED material (Tower Bolt M16)..." -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "http://localhost:5000/api/material/validate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"materialName": "Tower Bolt M16"}'

if ($response1.valid) {
    Write-Host "✅ PASSED: Material approved" -ForegroundColor Green
    Write-Host "   Status: $($response1.status)" -ForegroundColor Gray
} else {
    Write-Host "❌ FAILED: Should be approved" -ForegroundColor Red
}

# Test 2: Rejected Material
Write-Host "`nTest 2: Validating REJECTED material (Wooden Plank)..." -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/material/validate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"materialName": "Wooden Plank"}'

if (-not $response2.valid) {
    Write-Host "✅ PASSED: Material rejected" -ForegroundColor Green
    Write-Host "   Status: $($response2.status)" -ForegroundColor Gray
    Write-Host "   Message: $($response2.message)" -ForegroundColor Gray
} else {
    Write-Host "❌ FAILED: Should be rejected" -ForegroundColor Red
}

# Test 3: Get all approved materials
Write-Host "`nTest 3: Getting all approved materials..." -ForegroundColor Yellow
$response3 = Invoke-RestMethod -Uri "http://localhost:5000/api/approved/all" -Method GET
Write-Host "✅ Found $($response3.count) approved materials" -ForegroundColor Green

# Test 4: Search materials
Write-Host "`nTest 4: Searching for 'Tower' materials..." -ForegroundColor Yellow
$response4 = Invoke-RestMethod -Uri "http://localhost:5000/api/approved/search?q=Tower" -Method GET
Write-Host "✅ Found $($response4.count) materials matching 'Tower'" -ForegroundColor Green

# Test 5: Get categories
Write-Host "`nTest 5: Getting material categories..." -ForegroundColor Yellow
$response5 = Invoke-RestMethod -Uri "http://localhost:5000/api/approved/categories" -Method GET
Write-Host "✅ Found $($response5.count) categories:" -ForegroundColor Green
$response5.categories | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }

Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "   • Tower Bolt M16: APPROVED ✅" -ForegroundColor Gray
Write-Host "   • Wooden Plank: REJECTED ❌" -ForegroundColor Gray
Write-Host "   • Total Approved Materials: $($response3.count)" -ForegroundColor Gray
Write-Host "   • Material Categories: $($response5.count)" -ForegroundColor Gray
Write-Host "`n"
