@echo off
title Workflow Server Launcher
color 0B
echo.
echo  ==========================================
echo   Workflow - Approval System
echo  ==========================================
echo.

:: Kill existing node processes
echo  [1/3] Stopping existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Backend
echo  [2/3] Starting Backend (port 3001)...
start "Workflow Backend" cmd /k "cd /d e:\claudework\workflow-app\backend && node src/server.js"
timeout /t 3 /nobreak >nul

:: Start Frontend
echo  [3/3] Starting Frontend (port 5173)...
start "Workflow Frontend" cmd /k "cd /d e:\claudework\workflow-app\frontend && npx vite --host"
timeout /t 4 /nobreak >nul

echo.
echo  ==========================================
echo   Servers are running!
echo   Backend  : http://localhost:3001
echo   Frontend : http://localhost:5173
echo   Mobile   : http://192.168.1.50:5173
echo  ==========================================
echo.
echo  (กด Enter เพื่อปิดหน้าต่างนี้)
pause >nul
