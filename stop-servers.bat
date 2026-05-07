@echo off
title Stop Workflow Servers
color 0C
echo.
echo  Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo  Done! All servers stopped.
echo.
timeout /t 2 /nobreak >nul
