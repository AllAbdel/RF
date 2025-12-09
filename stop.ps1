# ========================================
# 🛑 RentFlow - Script d'arret
# ========================================
# Arrete tous les serveurs Node.js

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🛑 RentFlow - Arret des serveurs" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Arreter tous les processus Node
Write-Host "Arret des serveurs Node.js..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $count = $nodeProcesses.Count
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ $count processus Node arretes" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus Node en cours d'execution" -ForegroundColor Gray
}

# Arreter tous les jobs PowerShell
$jobs = Get-Job -ErrorAction SilentlyContinue
if ($jobs) {
    $jobs | Stop-Job
    $jobs | Remove-Job
    Write-Host "✅ Jobs PowerShell nettoyes" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ Tous les serveurs sont arretes" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Start-Sleep -Seconds 2
