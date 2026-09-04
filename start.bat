@echo off
start "Placement Portal Backend" /D "%~dp0backend" cmd /k "python manage.py migrate & python manage.py runserver"
cd /d "%~dp0frontend"
npm run dev
pause
