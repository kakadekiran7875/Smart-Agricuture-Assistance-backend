@echo off
echo ========================================
echo   Port 5001 Cleanup Utility
echo ========================================
echo.
echo Checking for processes on port 5001...
echo.

netstat -ano | findstr :5001 > nul
if %errorlevel% equ 0 (
    echo Found process(es) using port 5001:
    netstat -ano | findstr :5001
    echo.
    echo Killing process(es)...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
        echo Killing PID: %%a
        taskkill /F /PID %%a 2>nul
    )
    echo.
    echo ✅ Port 5001 is now free!
) else (
    echo ✅ Port 5001 is already free - no process found
)
echo.
echo ========================================
pause
