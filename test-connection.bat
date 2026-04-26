@echo off
echo ========================================
echo   Network Connection Test
echo ========================================
echo.
echo Backend IP: 10.119.11.239:5001
echo Frontend IP: 10.119.11.172
echo.

echo 1. Testing localhost...
curl -s http://localhost:5001/health
echo.
echo.

echo 2. Testing 127.0.0.1...
curl -s http://127.0.0.1:5001/health
echo.
echo.

echo 3. Testing backend IP (10.119.11.239)...
curl -s http://10.119.11.239:5001/health
echo.
echo.

echo 4. Testing Fertilizer API...
curl -X POST http://10.119.11.239:5001/api/fertilizer/recommend ^
  -H "Content-Type: application/json" ^
  -d "{\"crop\":\"Rice\",\"nitrogen\":120,\"phosphorus\":50,\"potassium\":50}"
echo.
echo.

echo ========================================
echo   Connection Test Complete
echo ========================================
echo.
echo If all tests passed, the backend is working.
echo If frontend shows error, check:
echo   1. Frontend can reach 10.119.11.239
echo   2. Firewall allows port 5001
echo   3. Both machines on same network
echo.
pause
