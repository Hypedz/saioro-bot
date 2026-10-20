# Liga o bot em segundo plano, sem janela.
# Usado pela Tarefa Agendada "Bot Discord" no logon do Windows.
# Tambem pode ser rodado na mao: powershell -File scripts\iniciar-oculto.ps1

$raiz = Split-Path -Parent $PSScriptRoot
$log = Join-Path $raiz 'bot.log'
$logErro = Join-Path $raiz 'bot.err.log'

# Trava: se ja existe um node rodando este bot, nao abre outro.
$jaRodando = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*src\index.js*' }

if ($jaRodando) {
  "$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')  ja estava rodando (PID $($jaRodando.ProcessId))" |
    Out-File -FilePath $log -Append -Encoding utf8
  exit 0
}

Start-Process -FilePath 'node' `
  -ArgumentList 'src\index.js' `
  -WorkingDirectory $raiz `
  -RedirectStandardOutput $log `
  -RedirectStandardError $logErro `
  -WindowStyle Hidden
