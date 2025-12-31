@echo off
setlocal enabledelayedexpansion

REM ─── Set Colors (ANSI) ──────────────────────────────────────────────────────
set "green=[92m"
set "red=[91m"
set "yellow=[93m"
set "reset=[0m"

echo.
echo %yellow%Git Push Manager starting...%reset%

REM ─── Check Git User Configuration ───────────────────────────────────────────
echo.
echo %yellow%Checking git user configuration...%reset%
for /f "tokens=*" %%i in ('git config user.email') do set current_email=%%i
for /f "tokens=*" %%i in ('git config user.name') do set current_name=%%i

echo Current git user: %current_name% ^<%current_email%^>

REM Check if using placeholder email
echo %current_email% | findstr /i "example.com noreply placeholder" >nul
if not errorlevel 1 (
    echo.
    echo %red%WARNING: You're using a placeholder email (%current_email%)%reset%
    echo %yellow%This will cause Vercel deployment to fail!%reset%
    echo %yellow%Your commit email must match your GitHub account email.%reset%
    echo.
    echo To fix this, run:
    echo   git config user.email "your-github-email@example.com"
    echo   git config user.name "Your Name"
    echo.
    choice /C YN /M "Continue anyway (not recommended)"
    if errorlevel 2 exit /b 1
)

REM ─── Resolve Commit Message ─────────────────────────────────────────────
if "%~1"=="" (
    echo %yellow%Enter your commit message:%reset%
    set /p commit_message=Commit Message: 
) else (
    set commit_message=%*
)

REM ─── Use Default Message if None Provided ─────────────────────────────────
if "!commit_message!"=="" (
    set commit_message=Update on %date% at %time%
    echo %yellow%No message provided. Using default: "!commit_message!"%reset%
)

REM ─── Stage All Changes ────────────────────────────────────────────────────
echo.
echo %yellow%Staging changes...%reset%
git add -A
if errorlevel 1 (
    echo %red%Error: Failed to stage files.%reset%
    pause
    exit /b 1
)

REM ─── Commit Changes ────────────────────────────────────────────────────────
echo.
echo %yellow%Committing changes...%reset%
git commit -m "!commit_message!"
if errorlevel 1 (
    echo %yellow%No changes to commit.%reset%
)

REM ─── Push Changes to Remote ────────────────────────────────────────────────
echo.
echo %yellow%Pushing to GitHub (main)...%reset%
git push origin main
if errorlevel 1 (
    echo.
    echo %red%Push failed.%reset%
    echo %yellow%Checking for remote changes...%reset%
    git pull origin main --rebase
    if errorlevel 1 (
        echo %red%Pull failed. Please resolve conflicts manually.%reset%
        pause
        exit /b 1
    )
    echo %yellow%Retrying push...%reset%
    git push origin main
)

if errorlevel 0 (
    echo.
    echo %green%Success! All changes pushed to GitHub.%reset%
) else (
    echo %red%Final push attempt failed.%reset%
)

echo.
pause
exit /b 0
