Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   RENTFLOW - DEMARRAGE COMPLET" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier MySQL
Write-Host "[1/3] Verification de MySQL..." -ForegroundColor Yellow
$mysqlPort = netstat -ano | findstr :3306 | Select-String "LISTENING"
if ($mysqlPort) {
    Write-Host "[OK] MySQL est actif" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] MySQL n'est pas actif" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "  1. Ouvrez XAMPP Control Panel" -ForegroundColor White
    Write-Host "  2. Cliquez sur 'Start' a cote de MySQL" -ForegroundColor White
    Write-Host "  3. Attendez que le statut devienne vert" -ForegroundColor White
    Write-Host ""
    Write-Host "Appuyez sur une touche apres avoir demarre MySQL..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Reverifier
    $mysqlPort = netstat -ano | findstr :3306 | Select-String "LISTENING"
    if (-not $mysqlPort) {
        Write-Host "[ERREUR] MySQL n'est toujours pas actif. Arret." -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "[OK] MySQL est maintenant actif" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/3] Demarrage du serveur backend..." -ForegroundColor Yellow

# Arreter les processus Node existants
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 1

# Demarrer le backend dans une nouvelle fenetre
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '   SERVEUR BACKEND - PORT 5000' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
cd E:\Perso\RentFlow-V2\backend
node server.js
"@

# Attendre que le backend demarre
Write-Host "   Attente du demarrage..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Verifier le backend
$backendPort = netstat -ano | findstr :5000 | Select-String "LISTENING"
if ($backendPort) {
    Write-Host "[OK] Backend demarre sur le port 5000" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Echec du demarrage du backend" -ForegroundColor Red
    Write-Host "   Verifiez la fenetre PowerShell du backend pour voir les erreurs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Demarrage du serveur frontend..." -ForegroundColor Yellow

# Verifier si npm est installe
$frontendPath = "E:\Perso\RentFlow-V2\frontend"
if (Test-Path "$frontendPath\node_modules") {
    # Demarrer le frontend dans une nouvelle fenetre
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '   SERVEUR FRONTEND - PORT 3000' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
cd E:\Perso\RentFlow-V2\frontend
npm start
"@
    Write-Host "[OK] Frontend en cours de demarrage..." -ForegroundColor Green
    Write-Host "   Le navigateur s'ouvrira automatiquement sur http://localhost:3000" -ForegroundColor Gray
} else {
    Write-Host "[ERREUR] node_modules manquant dans le frontend" -ForegroundColor Red
    Write-Host "   Executez: cd frontend && npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   DEMARRAGE TERMINE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les serveurs sont demarres dans des fenetres separees." -ForegroundColor White
Write-Host "Vous pouvez fermer cette fenetre." -ForegroundColor Gray
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
pause
