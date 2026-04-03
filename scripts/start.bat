@echo off
REM ─────────────────────────────────────────────────────────
REM  HybridRAG — Windows Launcher
REM  Double-click this file or run from Command Prompt
REM ─────────────────────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        HybridRAG Launcher            ║
echo  ╚══════════════════════════════════════╝
echo.

REM Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker ready

REM Create .env if missing
if not exist .env (
    copy .env.example .env
    echo [INFO] Created .env - add your OPENAI_API_KEY if needed
)

REM Create data dirs
if not exist data\uploads mkdir data\uploads
if not exist data\vectorstore mkdir data\vectorstore

REM Start
echo.
echo Starting services (first run may take 5-10 min to download models)...
echo.
docker compose up --build -d

echo.
echo  ╔══════════════════════════════════════╗
echo  ║  HybridRAG is starting up!           ║
echo  ║                                      ║
echo  ║  UI:      http://localhost:3000      ║
echo  ║  API:     http://localhost:8000      ║
echo  ║  API Docs:http://localhost:8000/docs ║
echo  ╚══════════════════════════════════════╝
echo.
echo Open http://localhost:3000 in your browser.
echo Run stop.bat to shut down.
pause
