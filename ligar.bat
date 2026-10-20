@echo off
chcp 65001 >nul
title Iniciar o bot (segundo plano)
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

powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process -Filter 'Name=''node.exe''' | Where-Object { $_.CommandLine -like '*src\index.js*' }; if ($p) { Write-Host 'O bot ja estava rodando. Use parar.bat para reiniciar.' } else { Start-Process -FilePath 'node' -ArgumentList 'src\index.js' -WorkingDirectory '%~dp0' -RedirectStandardOutput '%~dp0bot.log' -RedirectStandardError '%~dp0bot.err.log' -WindowStyle Hidden; Start-Sleep 5; Get-Content '%~dp0bot.log' }"
pause
