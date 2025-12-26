@echo off
REM ============================================
REM Script Chạy Tests với Coverage Report
REM ============================================

echo.
echo ========================================
echo   TEST COVERAGE REPORT
echo ========================================
echo.

REM Kiểm tra server
echo [1/3] Kiem tra server...
node check-server.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Server chua chay!
    pause
    exit /b 1
)

echo.
echo [2/3] Chay tests voi coverage...
echo.

call npm run test:coverage

if %errorlevel% neq 0 (
    echo.
    echo ❌ Tests that bai!
    pause
    exit /b 1
)

echo.
echo [3/3] Mo coverage report...
echo.

REM Kiểm tra file coverage report
if exist "coverage\lcov-report\index.html" (
    echo ✅ Coverage report da duoc tao thanh cong!
    echo.
    echo Dang mo report trong browser...
    start "" "coverage\lcov-report\index.html"
    echo.
    echo 📊 Coverage report: coverage\lcov-report\index.html
) else (
    echo ⚠️  Khong tim thay coverage report!
    echo    File nen o: coverage\lcov-report\index.html
)

echo.
echo ========================================
echo   HOAN TAT!
echo ========================================
echo.
echo Coverage report da duoc tao va mo trong browser.
echo Ban co the xem lai bat cu luc nao bang cach mo file:
echo   coverage\lcov-report\index.html
echo.
pause
