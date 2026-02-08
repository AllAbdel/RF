# ========================================
# RentFlow - Script de demarrage
# ========================================
# Lance MySQL, Backend et Frontend en arriere-plan
# Aucune fenetre supplementaire ne s'ouvre

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RentFlow - Demarrage" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# 1. Verifier et demarrer MySQL si necessaire
# ========================================
Write-Host "[1/3] Verification MySQL..." -ForegroundColor Yellow
$mysqlRunning = Get-Process -Name mysqld -ErrorAction SilentlyContinue
if (-not $mysqlRunning) {
    Write-Host "Demarrage de MySQL via UniServer..." -ForegroundColor Yellow
    $uniServerPath = "C:\UniServerZ\UniController.exe"
    
    if (Test-Path $uniServerPath) {
        Start-Process $uniServerPath
        Start-Sleep -Seconds 4
    } else {
        Write-Host "UniServer non trouve a : $uniServerPath" -ForegroundColor Red
        Write-Host "`nVerifiez le chemin d'installation d'UniServer" -ForegroundColor Yellow
        pause
        exit 1
    }
}
Write-Host "MySQL actif`n" -ForegroundColor Green

# ========================================
# 2. Arreter les anciens processus Node
# ========================================
Write-Host "[2/3] Nettoyage des anciens processus..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "Anciens processus Node arretes" -ForegroundColor Green
}
Start-Sleep -Seconds 1

# ========================================
# 3. Demarrer Backend (vraiment en arriere-plan)
# ========================================
Write-Host "`n[3/3] Demarrage du backend..." -ForegroundColor Yellow

$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location "$path\backend"
    node server.js
} -ArgumentList $PSScriptRoot

Start-Sleep -Seconds 3

# Verifier que le backend ecoute sur le port 5000
$backendPort = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Host "Backend demarre (port 5000)" -ForegroundColor Green
} else {
    Write-Host "Backend en cours de demarrage..." -ForegroundColor Yellow
}

# ========================================
# 4. Demarrer Frontend (vraiment en arriere-plan)
# ========================================
Write-Host "`nDemarrage du frontend..." -ForegroundColor Yellow

# Verifier que node_modules existe
$frontendPath = "$PSScriptRoot\frontend"
if (-not (Test-Path "$frontendPath\node_modules")) {
    Write-Host "node_modules manquant dans frontend" -ForegroundColor Red
    Write-Host "`nEXECUTEZ:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm install`n" -ForegroundColor White
    pause
    exit 1
}

$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location "$path\frontend"
    $env:BROWSER = "none"
    npm start 2>&1 | Out-Null
} -ArgumentList $PSScriptRoot

Write-Host "Frontend en cours de demarrage..." -ForegroundColor Green
Start-Sleep -Seconds 8

# Verifier que le frontend ecoute
$frontendPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Host "Frontend demarre (port 3000)" -ForegroundColor Green
} else {
    Write-Host "Frontend en cours de demarrage..." -ForegroundColor Yellow
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
Write-Host "   RentFlow demarre avec succes !" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "URLs d'acces:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White

Write-Host "`nJobs en cours:" -ForegroundColor Yellow
Write-Host "   Backend Job ID:  $($backendJob.Id)" -ForegroundColor Gray
Write-Host "   Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray

Write-Host "`nPour arreter les serveurs:" -ForegroundColor Yellow
Write-Host "   Executez: .\stop.ps1" -ForegroundColor White
Write-Host "   Ou: Get-Process -Name node | Stop-Process -Force`n" -ForegroundColor Gray

Write-Host "Appuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
Write-Host "(Les serveurs continueront a tourner en arriere-plan)" -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
