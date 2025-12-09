# ========================================
# 🚀 RentFlow - Script de demarrage
# ========================================
# Lance MySQL, Backend et Frontend en arriere-plan
# Aucune fenetre supplementaire ne s'ouvre

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🚗 RentFlow - Demarrage" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# 1. Verifier MySQL
# ========================================
Write-Host "[1/3] Verification MySQL..." -ForegroundColor Yellow
$mysqlRunning = Get-Process -Name mysqld -ErrorAction SilentlyContinue
if (-not $mysqlRunning) {
    Write-Host "❌ MySQL n'est pas demarre" -ForegroundColor Red
    Write-Host "`nSOLUTION:" -ForegroundColor Yellow
    Write-Host "  1. Ouvrez XAMPP Control Panel" -ForegroundColor White
    Write-Host "  2. Cliquez sur 'Start' e côte de MySQL" -ForegroundColor White
    Write-Host "  3. Relancez ce script`n" -ForegroundColor White
    pause
    exit 1
}
Write-Host "✅ MySQL actif`n" -ForegroundColor Green

# ========================================
# 2. Arreter les anciens processus Node
# ========================================
Write-Host "[2/3] Nettoyage des anciens processus..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Anciens processus Node arretes" -ForegroundColor Green
}
Start-Sleep -Seconds 1

# ========================================
# 3. Demarrer Backend (vraiment en arriere-plan)
# ========================================
Write-Host "`n[3/3] Demarrage du backend..." -ForegroundColor Yellow

# Utiliser Start-Job pour un vrai arriere-plan
$backendJob = Start-Job -ScriptBlock {
    Set-Location "E:\Perso\RentFlow-V2\backend"
    node server.js
}

Start-Sleep -Seconds 3

# Verifier que le backend ecoute sur le port 5000
$backendPort = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Host "✅ Backend demarre (port 5000)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend en cours de demarrage..." -ForegroundColor Yellow
}

# ========================================
# 4. Demarrer Frontend (vraiment en arriere-plan)
# ========================================
Write-Host "`nDemarrage du frontend..." -ForegroundColor Yellow

# Verifier que node_modules existe
$frontendPath = "E:\Perso\RentFlow-V2\frontend"
if (-not (Test-Path "$frontendPath\node_modules")) {
    Write-Host "❌ node_modules manquant dans frontend" -ForegroundColor Red
    Write-Host "`nEXeCUTEZ:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm install`n" -ForegroundColor White
    pause
    exit 1
}

# Utiliser Start-Job pour le frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "E:\Perso\RentFlow-V2\frontend"
    $env:BROWSER = "none"
    npm start 2>&1 | Out-Null
}

Write-Host "✅ Frontend en cours de demarrage..." -ForegroundColor Green
Start-Sleep -Seconds 8

# Verifier que le frontend ecoute
$frontendPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Host "✅ Frontend demarre (port 3000)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend en cours de demarrage..." -ForegroundColor Yellow
}

# ========================================
# 5. Ouvrir le navigateur
# ========================================
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

# ========================================
# Resume
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ RentFlow demarre avec succes !" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🌐 URLs d'acces:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White

Write-Host "`n📊 Jobs en cours:" -ForegroundColor Yellow
Write-Host "   Backend Job ID:  $($backendJob.Id)" -ForegroundColor Gray
Write-Host "   Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray

Write-Host "`n⚠️  Pour arreter les serveurs:" -ForegroundColor Yellow
Write-Host "   Executez: .\stop.ps1" -ForegroundColor White
Write-Host "   Ou: Get-Process -Name node | Stop-Process -Force`n" -ForegroundColor Gray

Write-Host "Appuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
Write-Host "(Les serveurs continueront e tourner en arriere-plan)" -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
