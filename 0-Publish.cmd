@echo off
setlocal

:: Get current date and time
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "date=%%c-%%a-%%b"
for /f "tokens=1-2 delims=:." %%a in ("%time%") do set "time=%%a-%%b"
set "datetime=%date%_%time%"

:: Format datetime for filename and remove any invalid characters
set "datetime=%datetime::=-%"
set "datetime=%datetime:.=-%"

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
