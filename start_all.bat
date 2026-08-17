@echo off
echo ============================================
echo    PR Controller - Start All Services
echo ============================================
echo.

:: Start PostgreSQL (requires admin)
echo [1/3] Starting PostgreSQL...
net start postgresql-x64-18
if %errorlevel% neq 0 (
    echo PostgreSQL already running or failed to start.
)
echo.

:: Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak > nul

:: Run DB migration
echo [2/3] Running DB migration...
cd /d "%~dp0backend"
python migrate_add_columns.py
echo.

:: Start FastAPI backend in a new window
echo [3/3] Starting FastAPI backend...
start "FastAPI Backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo.

echo ============================================
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:3001  (run npm run dev separately)
echo ============================================
pause
