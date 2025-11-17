# Script pour demarrer MySQL (UniServerZ), le frontend et le backend
Write-Host "Demarrage de Rentflow..." -ForegroundColor Green

# Lire la configuration personnalisee si elle existe
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

# Demarrer MySQL via UniServerZ
if ($uniServerPath) {
    Write-Host "UniServerZ trouve dans: $uniServerPath" -ForegroundColor Cyan
    Write-Host "Demarrage de MySQL..." -ForegroundColor Yellow
    
    # UniServerZ utilise mysqld_z.exe au lieu de mysqld.exe
    $mysqlPath = Join-Path $uniServerPath "core\mysql\bin\mysqld_z.exe"
    
    if (Test-Path $mysqlPath) {
        # Verifier si MySQL n'est pas dejà demarre
        $mysqlRunning = Get-Process mysqld_z -ErrorAction SilentlyContinue
        
        if (-not $mysqlRunning) {
            $myIniPath = Join-Path $uniServerPath "core\mysql\my.ini"
            if (Test-Path $myIniPath) {
                Start-Process $mysqlPath -ArgumentList "--defaults-file=`"$myIniPath`"" -WindowStyle Hidden
            } else {
                # Si my.ini n'existe pas, demarrer sans
                Start-Process $mysqlPath -WindowStyle Hidden
            }
            Write-Host "MySQL demarre avec succes!" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } else {
            Write-Host "MySQL est dejà en cours d'execution." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Erreur: mysqld_z.exe non trouve dans $uniServerPath!" -ForegroundColor Red
        Write-Host "Chemin verifie: $mysqlPath" -ForegroundColor Red
    }
} else {
    Write-Host "ATTENTION: UniServerZ non trouve!" -ForegroundColor Yellow
    Write-Host "Modifiez le fichier .config pour specifier le chemin vers UniServerZ" -ForegroundColor Yellow
    Write-Host "ou demarrez MySQL manuellement." -ForegroundColor Yellow
}

# Demarrer le backend
Write-Host "Demarrage du backend..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle Hidden", "-NoExit", "-Command `"cd '$PSScriptRoot\backend'; npm start`"" -PassThru -WindowStyle Hidden
$backendJob.Id | Out-File -FilePath "$PSScriptRoot\.backend-pid.txt"

# Attendre un peu avant de demarrer le frontend
Start-Sleep -Seconds 2

# Demarrer le frontend
Write-Host "Demarrage du frontend..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle Hidden", "-NoExit", "-Command `"cd '$PSScriptRoot\frontend'; npm start`"" -PassThru -WindowStyle Hidden
$frontendJob.Id | Out-File -FilePath "$PSScriptRoot\.frontend-pid.txt"

Write-Host "`nRentflow est en cours de demarrage!" -ForegroundColor Green
Write-Host "MySQL: localhost:3306" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nUtilisez stop.ps1 pour arreter les services." -ForegroundColor Yellow
