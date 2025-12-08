# Script pour demarrer RentFlow en mode debug (avec logs visibles)
Write-Host "Demarrage de Rentflow en mode DEBUG..." -ForegroundColor Green

# Lire la configuration
$configPath = Join-Path $PSScriptRoot ".config"
$customUniServerPath = $null

if (Test-Path $configPath) {
    $configContent = Get-Content $configPath
    foreach ($line in $configContent) {
        if ($line -match "^UNISERVER_PATH=(.+)$") {
            $customUniServerPath = $matches[1].Trim()
            if ($customUniServerPath -and (Test-Path $customUniServerPath)) {
                Write-Host "Utilisation du chemin personnalise depuis .config" -ForegroundColor Cyan
                break
            }
        }
    }
}

# Chemins possibles pour UniServerZ
$uniServerPaths = @(
    $customUniServerPath,
    "C:\UniServerZ",
    "C:\Program Files\UniServerZ",
    "D:\UniServerZ",
    "E:\UniServerZ"
) | Where-Object { $_ }

# Trouver UniServerZ
$uniServerPath = $null
foreach ($path in $uniServerPaths) {
    if (Test-Path $path) {
        $uniServerPath = $path
        break
    }
}

# Demarrer MySQL
if ($uniServerPath) {
    Write-Host "UniServerZ trouve dans: $uniServerPath" -ForegroundColor Cyan
    Write-Host "Demarrage de MySQL..." -ForegroundColor Yellow
    
    $mysqlPath = Join-Path $uniServerPath "core\mysql\bin\mysqld_z.exe"
    
    if (Test-Path $mysqlPath) {
        $mysqlRunning = Get-Process mysqld_z -ErrorAction SilentlyContinue
        
        if (-not $mysqlRunning) {
            $myIniPath = Join-Path $uniServerPath "core\mysql\my.ini"
            if (Test-Path $myIniPath) {
                Start-Process $mysqlPath -ArgumentList "--defaults-file=`"$myIniPath`"" -WindowStyle Hidden
            } else {
                Start-Process $mysqlPath -WindowStyle Hidden
            }
            Write-Host "MySQL demarre!" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } else {
            Write-Host "MySQL deja en cours." -ForegroundColor Yellow
        }
    }
}

# Demarrer le backend en mode VISIBLE
Write-Host "Demarrage du backend (mode debug - fenetre visible)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd '$PSScriptRoot\backend'; Write-Host 'Backend RentFlow - Mode Debug' -ForegroundColor Green; node server.js`""

Start-Sleep -Seconds 2

# Demarrer le frontend en mode cache
Write-Host "Demarrage du frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle Hidden", "-NoExit", "-Command `"cd '$PSScriptRoot\frontend'; npm start`""

Write-Host "`nRentflow demarre en MODE DEBUG!" -ForegroundColor Green
Write-Host "Une fenetre PowerShell s'est ouverte avec les logs du backend." -ForegroundColor Cyan
Write-Host "Surveillez cette fenetre pour voir les erreurs SQL." -ForegroundColor Yellow
Write-Host "`nMySQL: localhost:3306" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nUtilisez stop.ps1 pour arreter les services." -ForegroundColor Yellow
