Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  DIAGNOSTIC RENTFLOW - Base de données" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# 1. Vérifier si MySQL écoute sur le port 3306
Write-Host "[1/5] Vérification du port 3306..." -ForegroundColor Cyan
$mysqlPort = netstat -ano | Select-String ":3306"
if ($mysqlPort) {
    Write-Host "   ✅ MySQL écoute sur le port 3306" -ForegroundColor Green
    Write-Host "   $mysqlPort" -ForegroundColor Gray
} else {
    Write-Host "   ❌ MySQL ne répond pas sur le port 3306" -ForegroundColor Red
    Write-Host "   → Démarrez MySQL avec XAMPP/WAMP ou le service Windows" -ForegroundColor Yellow
}

# 2. Vérifier les services MySQL
Write-Host "`n[2/5] Recherche des services MySQL..." -ForegroundColor Cyan
$mysqlServices = Get-Service | Where-Object {
    $_.DisplayName -like "*MySQL*" -or 
    $_.DisplayName -like "*MariaDB*" -or
    $_.Name -like "*MySQL*"
}
if ($mysqlServices) {
    foreach ($service in $mysqlServices) {
        $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "   Service: $($service.DisplayName)" -ForegroundColor Gray
        Write-Host "   Statut: $($service.Status)" -ForegroundColor $statusColor
        Write-Host "   Nom: $($service.Name)`n" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  Aucun service MySQL trouvé" -ForegroundColor Yellow
    Write-Host "   → Vous utilisez probablement XAMPP/WAMP/Laragon" -ForegroundColor Gray
}

# 3. Vérifier les processus MySQL
Write-Host "[3/5] Recherche des processus MySQL..." -ForegroundColor Cyan
$mysqlProcesses = Get-Process | Where-Object {$_.Name -like "*mysql*"}
if ($mysqlProcesses) {
    Write-Host "   ✅ Processus MySQL trouvés:" -ForegroundColor Green
    foreach ($proc in $mysqlProcesses) {
        Write-Host "   - $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Aucun processus MySQL actif" -ForegroundColor Red
}

# 4. Chercher les installations MySQL
Write-Host "`n[4/5] Recherche d'installations MySQL..." -ForegroundColor Cyan
$paths = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql",
    "C:\laragon\bin\mysql",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
)
$found = $false
foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "   ✅ Trouvé: $path" -ForegroundColor Green
        $found = $true
    }
}
if (-not $found) {
    Write-Host "   ⚠️  Aucune installation trouvée dans les chemins standard" -ForegroundColor Yellow
}

# 5. Test de connexion Node.js
Write-Host "`n[5/5] Test de connexion depuis Node.js..." -ForegroundColor Cyan
Push-Location E:\Perso\RentFlow-V2\backend
$testResult = node test-db-connection.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Connexion réussie!" -ForegroundColor Green
    Write-Host $testResult -ForegroundColor Gray
} else {
    Write-Host "   ❌ Échec de connexion" -ForegroundColor Red
    Write-Host "   Erreur: $testResult" -ForegroundColor Gray
}
Pop-Location

# Résumé et actions
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  ACTIONS RECOMMANDÉES" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

if (-not $mysqlPort) {
    Write-Host "🔴 MySQL n'est PAS démarré!" -ForegroundColor Red
    Write-Host "`nPour le démarrer:" -ForegroundColor Yellow
    Write-Host "  1️⃣  Ouvrez XAMPP Control Panel" -ForegroundColor Cyan
    Write-Host "  2️⃣  Cliquez sur 'Start' à côté de MySQL" -ForegroundColor Cyan
    Write-Host "  3️⃣  Attendez que le voyant devienne vert" -ForegroundColor Cyan
    Write-Host "`n  OU exécutez en tant qu'Administrateur:" -ForegroundColor Yellow
    Write-Host "     net start MySQL80" -ForegroundColor Green
} else {
    Write-Host "✅ MySQL est démarré et accessible!" -ForegroundColor Green
    Write-Host "`nVous pouvez maintenant:" -ForegroundColor Cyan
    Write-Host "  • Démarrer le backend: cd backend ; node server.js" -ForegroundColor Gray
    Write-Host "  • Démarrer le frontend: cd frontend ; npm start" -ForegroundColor Gray
}

Write-Host "`n========================================`n" -ForegroundColor Yellow
