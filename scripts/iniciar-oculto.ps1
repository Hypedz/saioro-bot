# Liga o bot em segundo plano, sem janela, com auto-restart (supervisor).
# Usado pelo atalho da pasta Inicializar do Windows.
# Tambem pode ser rodado na mao: powershell -File scripts\iniciar-oculto.ps1

$raiz = Split-Path -Parent $PSScriptRoot
$logSup = Join-Path $raiz 'supervisor.log'
$pastaDados = Join-Path $raiz 'dados'
$supervisor = Join-Path $PSScriptRoot 'supervisor.ps1'

. (Join-Path $PSScriptRoot 'processos.ps1')

New-Item -ItemType Directory -Force -Path $pastaDados | Out-Null

# Trava: se ja existe bot ou supervisor rodando, nao abre outro.
$supPid = Ler-PidVivo (Join-Path $pastaDados 'supervisor.pid') 'powershell'
$botPid = Ler-PidVivo (Join-Path $pastaDados 'bot.pid') 'node'

if ($supPid -or $botPid) {
  $ids = @($supPid, $botPid) | Where-Object { $_ }
  "$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')  iniciar: ja estava rodando (PID $($ids -join ', '))" |
    Out-File -FilePath $logSup -Append -Encoding utf8
  exit 0
}

Start-Process -FilePath 'powershell.exe' `
  -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$supervisor`"" `
  -WorkingDirectory $raiz `
  -WindowStyle Hidden
