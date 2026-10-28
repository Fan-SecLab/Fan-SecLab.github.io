@echo off
chcp 65001 >nul
rem ============================================================
rem  Fan-SecLab Blog - interactive console (launches menu.ps1)
rem  Keep this file ASCII-only: cmd.exe mis-parses Chinese bytes
rem  inside .cmd files. All Chinese UI lives in menu.ps1.
rem ============================================================
setlocal
cd /d "%~dp0"

if not exist "%~dp0menu.ps1" (
  echo [x] menu.ps1 not found next to this script.
  echo     Expected: %~dp0menu.ps1
  pause
  exit /b 1
)

rem -ExecutionPolicy Bypass: this machine blocks .ps1 by default
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0menu.ps1"

if errorlevel 1 (
  echo.
  echo [x] The menu exited with an error.
  echo     Check logs\menu-*.log for details.
  pause
)

endlocal
