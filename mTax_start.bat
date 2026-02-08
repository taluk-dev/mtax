@echo off
title mTax - Developer Control Center
echo [1/3] Starting Backend (FastAPI)...
cd backend
start "mTax Backend" /min cmd /c "python api.py"
cd ..

echo [2/3] Starting Frontend (Angular Development Server)...
cd frontend
start "mTax Frontend" /min cmd /c "npm start"
cd ..

echo [3/3] Waiting for services to initialize...
echo App will be available at http://localhost:4200
echo.
echo To stop the system, simply close the minimized terminal windows.
timeout /t 5
start http://localhost:4200
exit
