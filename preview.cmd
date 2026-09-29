@echo off
rem Serve the production build (dist/) exactly as deployed — static
rem catalog, hash router, /pawsmarket/ base — for pre-deploy verification.
set "PATH=C:\Users\HP\Downloads\office\.tools\node;%PATH%"
cd /d "%~dp0"
npm run preview -- --port 4173 --strictPort
