# Script de démarrage silencieux RentFlow
$ErrorActionPreference = "SilentlyContinue"

# Vérifier MySQL
$mysqlPort = netstat -ano | findstr :3306 | Select-String "LISTENING"
if (-not $mysqlPort) {
    Write-Host "[ERREUR] MySQL n'est pas actif. Veuillez démarrer MySQL dans XAMPP." -ForegroundColor Red
    pause
    exit 1
}

# Arrêter les processus Node existants
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Démarrer le backend en arrière-plan (sans fenêtre)
$backendJob = Start-Process powershell -ArgumentList "-WindowStyle", "Hidden", "-Command", @"
cd E:\Perso\RentFlow-V2\backend
node server.js
"@ -PassThru

Start-Sleep -Seconds 3

# Vérifier le backend
$backendPort = netstat -ano | findstr :5000 | Select-String "LISTENING"
if ($backendPort) {
    Write-Host "[OK] Backend démarré (port 5000)" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Backend non démarré" -ForegroundColor Red
}

# Démarrer le frontend en arrière-plan (sans fenêtre)
$frontendPath = "E:\Perso\RentFlow-V2\frontend"
if (Test-Path "$frontendPath\node_modules") {
    $env:BROWSER = "none"
    $frontendJob = Start-Process powershell -ArgumentList "-WindowStyle", "Hidden", "-Command", @"
cd E:\Perso\RentFlow-V2\frontend
`$env:BROWSER = 'none'
npm start
"@ -PassThru
    
    Write-Host "[OK] Frontend en cours de démarrage..." -ForegroundColor Green
    Start-Sleep -Seconds 8
    
    # Ouvrir le navigateur
    Start-Process "http://localhost:3000"
} else {
    Write-Host "[ERREUR] node_modules manquant. Exécutez: cd frontend && npm install" -ForegroundColor Red
}

Write-Host ""
Write-Host "Serveurs lancés en arrière-plan :" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Pour arrêter : Fermez cette fenêtre ou Ctrl+C" -ForegroundColor Gray
