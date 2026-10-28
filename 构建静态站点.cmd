@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo [1/2] Installing dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto fail
)

echo [2/2] Building static site...
call npm run build
if errorlevel 1 goto fail

echo.
echo Done. Static files are in "dist".
echo You can deploy that folder or preview it with: npm run preview
pause
goto end

:fail
echo.
echo Build failed, see the messages above.
pause

:end
