# Script pour démarrer MySQL (UniServerZ), le frontend et le backend
Write-Host "Démarrage de Rentflow..." -ForegroundColor Green

# Lire la configuration personnalisée si elle existe
$configPath = Join-Path $PSScriptRoot ".config"
$customUniServerPath = $null

if (Test-Path $configPath) {
    $configContent = Get-Content $configPath
    foreach ($line in $configContent) {
        if ($line -match "^UNISERVER_PATH=(.+)$") {
            $customUniServerPath = $matches[1].Trim()
            if ($customUniServerPath -and (Test-Path $customUniServerPath)) {
                Write-Host "Utilisation du chemin personnalisé depuis .config" -ForegroundColor Cyan
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

# Démarrer MySQL via UniServerZ
if ($uniServerPath) {
    Write-Host "UniServerZ trouvé dans: $uniServerPath" -ForegroundColor Cyan
    Write-Host "Démarrage de MySQL..." -ForegroundColor Yellow
    
    # UniServerZ utilise mysqld_z.exe au lieu de mysqld.exe
    $mysqlPath = Join-Path $uniServerPath "core\mysql\bin\mysqld_z.exe"
    
    if (Test-Path $mysqlPath) {
        # Vérifier si MySQL n'est pas déjà démarré
        $mysqlRunning = Get-Process mysqld_z -ErrorAction SilentlyContinue
        
        if (-not $mysqlRunning) {
            $myIniPath = Join-Path $uniServerPath "core\mysql\my.ini"
            if (Test-Path $myIniPath) {
                Start-Process $mysqlPath -ArgumentList "--defaults-file=`"$myIniPath`"" -WindowStyle Hidden
            } else {
                # Si my.ini n'existe pas, démarrer sans
                Start-Process $mysqlPath -WindowStyle Hidden
            }
            Write-Host "MySQL démarré avec succès!" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } else {
            Write-Host "MySQL est déjà en cours d'exécution." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Erreur: mysqld_z.exe non trouvé dans $uniServerPath!" -ForegroundColor Red
        Write-Host "Chemin vérifié: $mysqlPath" -ForegroundColor Red
    }
} else {
    Write-Host "ATTENTION: UniServerZ non trouvé!" -ForegroundColor Yellow
    Write-Host "Modifiez le fichier .config pour spécifier le chemin vers UniServerZ" -ForegroundColor Yellow
    Write-Host "ou démarrez MySQL manuellement." -ForegroundColor Yellow
}

# Démarrer le backend
Write-Host "Démarrage du backend..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle Hidden", "-NoExit", "-Command `"cd '$PSScriptRoot\backend'; npm start`"" -PassThru -WindowStyle Hidden
$backendJob.Id | Out-File -FilePath "$PSScriptRoot\.backend-pid.txt"

# Attendre un peu avant de démarrer le frontend
Start-Sleep -Seconds 2

# Démarrer le frontend
Write-Host "Démarrage du frontend..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle Hidden", "-NoExit", "-Command `"cd '$PSScriptRoot\frontend'; npm start`"" -PassThru -WindowStyle Hidden
$frontendJob.Id | Out-File -FilePath "$PSScriptRoot\.frontend-pid.txt"

Write-Host "`nRentflow est en cours de démarrage!" -ForegroundColor Green
Write-Host "MySQL: localhost:3306" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nUtilisez stop.ps1 pour arrêter les services." -ForegroundColor Yellow
