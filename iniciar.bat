@echo off
chcp 65001 >nul
title Bot do Discord
cd /d "%~dp0"

if not exist ".env" (
    echo ================================================
    echo   FALTA O ARQUIVO .env
    echo ================================================
    echo.
    echo Copie o ".env.example" e renomeie para ".env".
    echo Depois preencha DISCORD_TOKEN e CLIENT_ID.
    echo Passo a passo no README.md.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Instalando as dependencias ^(so na primeira vez^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha no npm install. O Node.js esta instalado?
        pause
        exit /b 1
    )
)

echo.
echo Registrando os comandos...
call npm run deploy
echo.
echo Ligando o bot. Para desligar, aperte Ctrl+C.
node src\index.js
pause
