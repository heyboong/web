@echo off
REM ============================================
REM Script Setup Test Environment cho Windows
REM ============================================

echo.
echo ========================================
echo   SETUP TEST ENVIRONMENT
echo ========================================
echo.

REM Kiểm tra Node.js
echo [1/4] Kiem tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chua duoc cai dat!
    echo    Vui long tai va cai dat Node.js tu: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js: 
node --version
echo.

REM Kiểm tra npm
echo [2/4] Kiem tra npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm chua duoc cai dat!
    pause
    exit /b 1
)
echo ✅ npm: 
npm --version
echo.

REM Kiểm tra và cài đặt dependencies
echo [3/4] Kiem tra dependencies...
if not exist "node_modules" (
    echo 📦 Chua co node_modules, dang cai dat dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Loi khi cai dat dependencies!
        pause
        exit /b 1
    )
    echo ✅ Dependencies da duoc cai dat thanh cong!
) else (
    echo ✅ Dependencies da ton tai
    echo    Neu muon cai dat lai, chay: npm install
)
echo.

REM Kiểm tra server
echo [4/4] Kiem tra server...
node check-server.js
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Server chua chay!
    echo    Vui long khoi dong server truoc khi chay test.
    echo.
    echo 📌 Huong dan:
    echo    1. Mo terminal moi
    echo    2. cd dashboard
    echo    3. npm run server
    echo.
    pause
    exit /b 1
)
echo.

echo ========================================
echo   ✅ SETUP HOAN TAT!
echo ========================================
echo.
echo Ban co the chay test bang cac lenh:
echo   - npm test              (Tat ca tests)
echo   - npm run test:auth     (Authentication tests)
echo   - npm run test:tools    (Tools tests)
echo   - npm run test:phishing (Phishing tests)
echo   - npm run test:coverage (Test voi coverage)
echo.
echo Hoac su dung script tu dong:
echo   - run-all-tests.bat     (Chay tat ca tests)
echo.
pause
