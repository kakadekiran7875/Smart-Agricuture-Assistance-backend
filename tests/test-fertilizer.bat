@echo off
echo Testing Fertilizer Recommendation API...
echo.

curl -X POST http://10.119.11.239:5001/api/fertilizer/recommend ^
  -H "Content-Type: application/json" ^
  -d "{\"crop\":\"Rice\",\"nitrogen\":250,\"phosphorus\":30,\"potassium\":150}"

echo.
echo.
pause
