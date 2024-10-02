@echo off
setlocal

REM Navigate to the source directory
cd ".\Source\SmartToolKit\"

REM Execute ng build and check for errors
call ng build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

REM Copy files using xcopy with the /y switch to overwrite existing files
xcopy ".\dist\smart-tool-kit\browser\" "..\.." /s /e /h /i /y
if %errorlevel% neq 0 (
    echo Copy failed!
    exit /b %errorlevel%
)

echo Build and copy successful!
pause
endlocal
