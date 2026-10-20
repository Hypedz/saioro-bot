@echo off
chcp 65001 >nul
title Parar o bot do Discord
powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process -Filter 'Name=''node.exe''' | Where-Object { $_.CommandLine -like '*src\index.js*' }; if (-not $p) { Write-Host 'O bot ja estava parado.' } else { $p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Bot parado (PID ' + $_.ProcessId + ').') } }"
pause
