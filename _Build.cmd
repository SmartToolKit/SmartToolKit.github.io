@echo off
setlocal

REM Navigate to the source directory
cd ".\Source\SmartToolKit\"

REM Execute ng build and check for errors
call npm install
call ng build --output-path ./../../docs --configuration production
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

REM Copy files using xcopy with the /y switch to overwrite existing files
xcopy ".\..\..\docs\browser\" ".\..\..\docs\" /s /e /h /i /y
if %errorlevel% neq 0 (
    echo Copy failed!
    exit /b %errorlevel%
)

echo Build and copy successful!
pause
endlocal
