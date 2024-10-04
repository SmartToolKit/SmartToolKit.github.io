@echo off
setlocal

:: Get current date in YYYY-MM-DD format
for /f "tokens=2-4 delims=/.- " %%a in ('echo %date%') do (
    if "%%c" neq "" (
        set "date=%%c-%%a-%%b"
    ) else (
        for /f "tokens=1-3 delims=.-/ " %%x in ("%date%") do set "date=%%x-%%y-%%z"
    )
)

:: Get current time in HHMM format (24-hour clock)
for /f "tokens=1-2 delims=:." %%a in ("%time%") do set "time=%%a-%%b"

:: Combine date and time
set "datetime=%date%-%time%"

:: Ask the user if they want to publish
set /p userInput=Do you want to publish changes? (yes/no): 

:: Convert the input to lowercase for easier comparison
set "userInput=%userInput:~0,1%"

if /I "%userInput%" == "y" (
    :: Commit and push to git
    echo Committing changes...
    git add .
    git commit -m "Publish in %datetime%"
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to commit changes.
        exit /b 1
    )

    echo Pushing changes...
    git push
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to push changes.
        exit /b 1
    )
    
    echo Changes have been published.
) else (
    echo No changes were published.
)

endlocal
