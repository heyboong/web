@echo off
REM ============================================
REM Script Chạy Tests với Watch Mode
REM Tự động chạy lại tests khi có thay đổi
REM ============================================

echo.
echo ========================================
echo   TEST WATCH MODE
echo ========================================
echo.

REM Kiểm tra server
echo Kiem tra server...
node check-server.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Server chua chay!
    pause
    exit /b 1
)

echo.
echo ✅ Server dang chay
echo.
echo ========================================
echo   WATCH MODE ACTIVE
echo ========================================
echo.
echo Tests se tu dong chay lai khi co thay doi
echo Nhan Ctrl+C de dung watch mode
echo.
echo ========================================
echo.

call npm run test:watch
