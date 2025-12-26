@echo off
REM ============================================
REM Script Chạy Tests Tự Động cho Windows
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   WEBKEY/SCANVIA TEST RUNNER
echo ========================================
echo.

REM Kiểm tra server
echo [1/3] Kiem tra server...
node check-server.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Khong the ket noi den server!
    echo    Vui long khoi dong server truoc.
    echo.
    pause
    exit /b 1
)
echo.

REM Chạy tests
echo [2/3] Chay tests...
echo.
echo ========================================
echo   RUNNING TESTS
echo ========================================
echo.

call npm test

set TEST_EXIT_CODE=%errorlevel%

echo.
echo ========================================

if %TEST_EXIT_CODE% equ 0 (
    echo   ✅ TAT CA TESTS PASSED!
) else (
    echo   ❌ CO TESTS FAILED!
)

echo ========================================
echo.

REM Tạo báo cáo
echo [3/3] Tao bao cao...

REM Lấy thời gian hiện tại
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set REPORT_DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
set REPORT_TIME=%datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%

REM Tạo file báo cáo
echo # Test Results Report > ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md
echo **Date:** %REPORT_DATE% >> ..\TEST_RESULTS_AUTO.md
echo **Time:** %REPORT_TIME% >> ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md

if %TEST_EXIT_CODE% equ 0 (
    echo **Status:** ✅ ALL TESTS PASSED >> ..\TEST_RESULTS_AUTO.md
) else (
    echo **Status:** ❌ SOME TESTS FAILED >> ..\TEST_RESULTS_AUTO.md
)

echo. >> ..\TEST_RESULTS_AUTO.md
echo ## Test Execution >> ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md
echo Tests were executed automatically using run-tests.bat script. >> ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md
echo ### Commands Run: >> ..\TEST_RESULTS_AUTO.md
echo - npm test >> ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md
echo ### Test Modules: >> ..\TEST_RESULTS_AUTO.md
echo - Authentication Tests (tests/api/auth.test.js) >> ..\TEST_RESULTS_AUTO.md
echo - Tools Tests (tests/api/tools.test.js) >> ..\TEST_RESULTS_AUTO.md
echo - Phishing Tests (tests/api/phishing.test.js) >> ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md
echo For detailed results, check the console output above. >> ..\TEST_RESULTS_AUTO.md
echo. >> ..\TEST_RESULTS_AUTO.md
echo --- >> ..\TEST_RESULTS_AUTO.md
echo Generated automatically by run-tests.bat >> ..\TEST_RESULTS_AUTO.md

echo ✅ Bao cao da duoc luu tai: TEST_RESULTS_AUTO.md
echo.

REM Hỏi có muốn chạy coverage không
echo.
set /p RUN_COVERAGE="Ban co muon chay test coverage? (y/n): "
if /i "%RUN_COVERAGE%"=="y" (
    echo.
    echo Dang chay test coverage...
    call npm run test:coverage
    echo.
    echo ✅ Coverage report da duoc tao trong thu muc: coverage/
    echo    Mo file coverage/lcov-report/index.html de xem chi tiet
)

echo.
echo ========================================
echo   HOAN TAT!
echo ========================================
echo.
pause

exit /b %TEST_EXIT_CODE%
