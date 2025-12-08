Write-Host "====================================" -ForegroundColor Cyan
Write-Host "   SERVEUR BACKEND - AUTO RESTART" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$maxRetries = 5
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    Write-Host "Démarrage du serveur (tentative $($retryCount + 1)/$maxRetries)..." -ForegroundColor Green
    Write-Host ""
    
    # Démarrer le serveur
    $process = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "E:\Perso\RentFlow-V2\backend" -PassThru -NoNewWindow
    
    # Attendre que le processus se termine
    $process.WaitForExit()
    
    $exitCode = $process.ExitCode
    Write-Host ""
    Write-Host "Le serveur s'est arrêté (code: $exitCode)" -ForegroundColor Yellow
    
    if ($exitCode -eq 0) {
        Write-Host "Arrêt normal du serveur." -ForegroundColor Green
        break
    } else {
        Write-Host "Erreur détectée!" -ForegroundColor Red
        $retryCount++
        
        if ($retryCount -lt $maxRetries) {
            Write-Host "Redémarrage dans 3 secondes..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        } else {
            Write-Host ""
            Write-Host "====================================" -ForegroundColor Red
            Write-Host "   TROP D'ERREURS - ARRÊT" -ForegroundColor Red
            Write-Host "====================================" -ForegroundColor Red
            Write-Host ""
            Write-Host "Vérifiez les erreurs ci-dessus." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
