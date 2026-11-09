@echo off
echo [Smart Agri] Checking and terminating any process on port 5001...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('Killed PID ' + $_.OwningProcess) }"
echo [Smart Agri] Port 5001 is completely free!
pause
