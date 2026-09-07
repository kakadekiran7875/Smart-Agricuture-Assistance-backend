@echo off
echo ========================================
echo   Smart Agriculture Backend Starter
echo ========================================
echo.

REM Check if port 5001 is in use
netstat -ano | findstr :5001 > nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 5001 is already in use!
    echo.
    echo Cleaning up port 5001...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
        echo Killing PID: %%a
        taskkill /F /PID %%a 2>nul
    )
    echo ✅ Port cleaned!
    echo.
    timeout /t 2 /nobreak > nul
)

echo Starting backend server...
echo.
npm run dev

pause
