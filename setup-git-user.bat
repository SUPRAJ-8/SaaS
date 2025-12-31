@echo off
setlocal enabledelayedexpansion

REM ─── Set Colors (ANSI) ──────────────────────────────────────────────────────
set "green=[92m"
set "red=[91m"
set "yellow=[93m"
set "reset=[0m"

echo.
echo %yellow%Git User Configuration Setup%reset%
echo.

REM ─── Get Current Configuration ───────────────────────────────────────────
for /f "tokens=*" %%i in ('git config user.name') do set current_name=%%i
for /f "tokens=*" %%i in ('git config user.email') do set current_email=%%i

echo Current configuration:
echo   Name: %current_name%
echo   Email: %current_email%
echo.

REM ─── Get New Name ─────────────────────────────────────────────────────────
echo %yellow%Enter your git user name (or press Enter to keep current):%reset%
set /p new_name=Name: 
if "!new_name!"=="" set new_name=%current_name%

REM ─── Get New Email ────────────────────────────────────────────────────────
echo.
echo %yellow%Enter your git user email (must match your GitHub account email):%reset%
echo %yellow%Or press Enter to keep current:%reset%
set /p new_email=Email: 
if "!new_email!"=="" set new_email=%current_email%

REM ─── Update Configuration ─────────────────────────────────────────────────
echo.
echo %yellow%Updating git configuration...%reset%
git config user.name "!new_name!"
git config user.email "!new_email!"

if errorlevel 1 (
    echo %red%Error: Failed to update git configuration.%reset%
    pause
    exit /b 1
)

echo.
echo %green%Success! Git user configuration updated:%reset%
echo   Name: !new_name!
echo   Email: !new_email!
echo.
echo %yellow%Note: Make sure the email matches your GitHub account email%reset%
echo %yellow%to avoid Vercel deployment issues.%reset%
echo.
pause
exit /b 0

