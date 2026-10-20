@echo off
chcp 65001 >nul
title Iniciar o bot (segundo plano + auto-restart)
cd /d "%~dp0"

if not exist ".env" (
    echo [ERRO] Falta o arquivo .env. Veja o README.md.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo Instalando as dependencias...
    call npm install || (echo [ERRO] npm install falhou. & pause & exit /b 1)
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-oculto.ps1"

timeout /t 4 /nobreak >nul
echo.
echo --- ultimas linhas do bot.log ---
powershell -NoProfile -Command "if (Test-Path '%~dp0bot.log') { Get-Content '%~dp0bot.log' -Tail 15 }"
echo.
echo O supervisor religa o bot sozinho se ele cair. Para parar tudo, use parar.bat.
pause
