# Script pour arrêter le frontend, le backend et MySQL
Write-Host "Arrêt de Rentflow..." -ForegroundColor Red

# Arrêter tous les processus Node.js liés au projet
Write-Host "Arrêt du backend et du frontend..." -ForegroundColor Yellow

# Tuer tous les processus node qui correspondent à notre projet
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*$PSScriptRoot*"
} | Stop-Process -Force

# Arrêter MySQL (UniServerZ)
Write-Host "Arrêt de MySQL..." -ForegroundColor Yellow
$mysqlProcess = Get-Process mysqld_z -ErrorAction SilentlyContinue
if ($mysqlProcess) {
    Stop-Process -Name mysqld_z -Force -ErrorAction SilentlyContinue
    Write-Host "MySQL arrêté." -ForegroundColor Green
} else {
    Write-Host "MySQL n'était pas en cours d'exécution." -ForegroundColor Yellow
}

# Nettoyer les fichiers PID
if (Test-Path "$PSScriptRoot\.backend-pid.txt") {
    Remove-Item "$PSScriptRoot\.backend-pid.txt" -Force
}
if (Test-Path "$PSScriptRoot\.frontend-pid.txt") {
    Remove-Item "$PSScriptRoot\.frontend-pid.txt" -Force
}

Write-Host "`nRentflow a été arrêté avec succès!" -ForegroundColor Green
