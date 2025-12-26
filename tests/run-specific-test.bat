@echo off
REM ============================================
REM Script Chạy Test Cụ Thể cho Windows
REM ============================================

echo.
echo ========================================
echo   CHON MODULE TEST
echo ========================================
echo.
echo 1. Authentication Tests
echo 2. Tools Tests
echo 3. Phishing Tests
echo 4. Tat ca tests
echo 5. Test voi Coverage
echo 6. Test voi Watch mode
echo 0. Thoat
echo.

set /p choice="Nhap lua chon cua ban (0-6): "

if "%choice%"=="0" exit /b 0

REM Kiểm tra server
echo.
echo Kiem tra server...
node check-server.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Server chua chay!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   CHAY TESTS
echo ========================================
echo.

if "%choice%"=="1" (
    echo Chay Authentication Tests...
    call npm run test:auth
) else if "%choice%"=="2" (
    echo Chay Tools Tests...
    call npm run test:tools
) else if "%choice%"=="3" (
    echo Chay Phishing Tests...
    call npm run test:phishing
) else if "%choice%"=="4" (
    echo Chay tat ca tests...
    call npm test
) else if "%choice%"=="5" (
    echo Chay tests voi coverage...
    call npm run test:coverage
    echo.
    echo ✅ Coverage report: coverage/lcov-report/index.html
) else if "%choice%"=="6" (
    echo Chay tests voi watch mode...
    echo (Nhan Ctrl+C de dung)
    call npm run test:watch
) else (
    echo ❌ Lua chon khong hop le!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   HOAN TAT!
echo ========================================
echo.
pause
