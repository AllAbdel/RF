@echo off
cls
echo ========================================
echo   DEMARRAGE RENTFLOW
echo ========================================
echo.

REM Verification MySQL
echo [1/3] Verification MySQL...
netstat -ano | findstr :3306 >nul 2>&1
if %errorlevel% equ 0 (
    echo    OK MySQL ecoute sur le port 3306
) else (
    echo    ERREUR: MySQL n'est pas demarre!
    echo.
    echo    Solution: Demarrez MySQL avec XAMPP
    pause
    exit /b 1
)

REM Demarrage Backend
echo.
echo [2/3] Demarrage du backend...
cd /d E:\Perso\RentFlow-V2\backend
start "RentFlow Backend" cmd /k "node server.js"
timeout /t 3 >nul

REM Verification Backend
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo    OK Backend demarre sur le port 5000
) else (
    echo    ATTENTION: Le backend tarde a demarrer
    echo    Verifiez la fenetre "RentFlow Backend"
)

REM Demarrage Frontend
echo.
echo [3/3] Demarrage du frontend...
cd /d E:\Perso\RentFlow-V2\frontend
start "RentFlow Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   RENTFLOW DEMARRE
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Deux fenetres ont ete ouvertes:
echo   - RentFlow Backend  (Node.js)
echo   - RentFlow Frontend (React)
echo.
echo Pour arreter: Fermez les deux fenetres
echo.
pause
