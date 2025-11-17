# Script pour arreter le frontend, le backend et MySQL
Write-Host "Arret de Rentflow..." -ForegroundColor Red

# Arreter tous les processus Node.js lies au projet
Write-Host "Arret du backend et du frontend..." -ForegroundColor Yellow

# Tuer tous les processus node qui correspondent à notre projet
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*$PSScriptRoot*"
} | Stop-Process -Force

# Arreter MySQL (UniServerZ)
Write-Host "Arret de MySQL..." -ForegroundColor Yellow
$mysqlProcess = Get-Process mysqld_z -ErrorAction SilentlyContinue
if ($mysqlProcess) {
    Stop-Process -Name mysqld_z -Force -ErrorAction SilentlyContinue
    Write-Host "MySQL arrete." -ForegroundColor Green
} else {
    Write-Host "MySQL n'etait pas en cours d'execution." -ForegroundColor Yellow
}

# Nettoyer les fichiers PID
if (Test-Path "$PSScriptRoot\.backend-pid.txt") {
    Remove-Item "$PSScriptRoot\.backend-pid.txt" -Force
}
if (Test-Path "$PSScriptRoot\.frontend-pid.txt") {
    Remove-Item "$PSScriptRoot\.frontend-pid.txt" -Force
}

Write-Host "`nRentflow a ete arrete avec succes!" -ForegroundColor Green
