@echo off
setlocal enabledelayedexpansion

REM ─── Set Colors (ANSI) ──────────────────────────────────────────────────────
set "green=[92m"
set "red=[91m"
set "yellow=[93m"
set "reset=[0m"

echo.
echo %yellow%Git Push Manager starting...%reset%

REM ─── Git User Configuration Check (commented out due to ANSI code parsing issues)
REM ─── Your git user is already correctly configured: SUPRAJ-8 <suprajsth8@gmail.com>

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
set "commit_success=0"
if errorlevel 1 (
    echo %yellow%No changes to commit.%reset%
    set "commit_success=1"
) else (
    echo %green%Commit successful!%reset%
)

REM ─── Check if there are commits to push ────────────────────────────────────
git log origin/main..main --oneline >nul 2>&1
set "has_commits_to_push=0"
if not errorlevel 1 (
    for /f %%i in ('git log origin/main..main --oneline ^| find /c /v ""') do set "commit_count=%%i"
    if defined commit_count (
        if !commit_count! gtr 0 (
            set "has_commits_to_push=1"
            echo %yellow%Found !commit_count! commit(s) to push.%reset%
        )
    )
)

REM ─── Push Changes to Remote ────────────────────────────────────────────────
if "!has_commits_to_push!"=="1" (
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
        echo %green%View your commits at: https://github.com/SUPRAJ-8/saas-frontend/commits/main%reset%
    ) else (
        echo %red%Final push attempt failed.%reset%
    )
) else (
    if "!commit_success!"=="1" (
        echo %yellow%No changes to push (working tree was already clean).%reset%
    ) else (
        echo %yellow%All commits are already on GitHub.%reset%
    )
)

echo.
pause
exit /b 0
