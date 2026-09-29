@echo off
rem PawsMarket dev launcher — puts portable Node on PATH for npm/vite shims
set "PATH=C:\Users\HP\Downloads\office\.tools\node;%PATH%"
cd /d "%~dp0"
npm run dev -- --port 5173 --strictPort
