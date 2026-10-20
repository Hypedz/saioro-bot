@echo off
chcp 65001 >nul
title Parar o bot do Discord
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ". '%~dp0scripts\processos.ps1'; $sup = Ler-PidVivo '%~dp0dados\supervisor.pid' 'powershell'; if ($sup) { Stop-Process -Id $sup -Force; Write-Host ('Supervisor parado (PID ' + $sup + ').') } else { Write-Host 'Nenhum supervisor rodando.' }; Start-Sleep 1; $bot = Ler-PidVivo '%~dp0dados\bot.pid' 'node'; if ($bot) { Stop-Process -Id $bot -Force; Write-Host ('Bot parado (PID ' + $bot + ').') } else { Write-Host 'O bot ja estava parado.' }; Remove-Item '%~dp0dados\supervisor.pid', '%~dp0dados\bot.pid' -Force -ErrorAction SilentlyContinue"
pause
