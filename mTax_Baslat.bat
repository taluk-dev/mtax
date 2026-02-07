@echo off
title mTax Uygulamasi Baslatiliyor...
echo mTax yukleniyor, lutfen bekleyin...
cd /d "%~dp0"
start /min streamlit run app.py
echo.
echo Uygulama tarayicida aciliyor.
echo Bu pencereyi uygulama acildiktan sonra kapatabilirsiniz.
timeout /t 5
