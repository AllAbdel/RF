@echo off
echo.
echo ========================================
echo   TEST DE CONNEXION MYSQL
echo ========================================
echo.

cd /d E:\Perso\RentFlow-V2\backend

echo [1/2] Verification du port 3306...
netstat -ano | findstr :3306
if %errorlevel% equ 0 (
    echo ✓ MySQL ecoute sur le port 3306
) else (
    echo X MySQL ne repond pas sur le port 3306
    echo.
    echo SOLUTION:
    echo - Ouvrez XAMPP Control Panel
    echo - Cliquez sur Start a cote de MySQL
    echo - Attendez que le statut devienne vert
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Test de connexion Node.js...
node test-db-connection.js
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCES - MySQL est accessible!
    echo ========================================
    echo.
    echo Vous pouvez maintenant:
    echo   1. Demarrer le backend: node server.js
    echo   2. Demarrer le frontend: npm start
) else (
    echo.
    echo ========================================
    echo   ECHEC - MySQL non accessible
    echo ========================================
    echo.
    echo Verifiez que MySQL est demarre.
)

echo.
pause
