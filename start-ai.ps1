# Script pour démarrer le service IA Python
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RentFlow - Demarrage Service IA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python detecte: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installe ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Telechargez Python depuis: https://www.python.org/downloads/" -ForegroundColor Yellow
    pause
    exit 1
}

# Vérifier si les dépendances sont installées
Write-Host "📦 Verification des dependances..." -ForegroundColor Yellow

$pipList = pip list 2>&1 | Out-String

if ($pipList -notmatch "fastapi") {
    Write-Host "Installation de fastapi..." -ForegroundColor Yellow
    pip install fastapi uvicorn pydantic
}

Write-Host "✅ Dependances OK" -ForegroundColor Green
Write-Host ""

# Démarrer le service IA
Write-Host "🚀 Demarrage du service IA (port 8000)..." -ForegroundColor Cyan

Set-Location backend\services
Start-Job -ScriptBlock {
    param($workDir)
    Set-Location $workDir
    python ai_advisor_api.py
} -ArgumentList (Get-Location).Path | Out-Null

Write-Host "✅ Service IA demarre en arriere-plan" -ForegroundColor Green
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000" -ForegroundColor White
Write-Host "  http://localhost:8000/docs (Documentation API)" -ForegroundColor White
Write-Host ""
Write-Host "Pour arreter: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host ""

pause
