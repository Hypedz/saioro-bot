# Supervisor do bot: mantem o node rodando e religa se ele cair.
# Uso normal: iniciar-oculto.ps1 (esconde a janela) ou ligar.bat.
# Para parar tudo: parar.bat.

$raiz = Split-Path -Parent $PSScriptRoot
$log = Join-Path $raiz 'bot.log'
$logErro = Join-Path $raiz 'bot.err.log'
$logSup = Join-Path $raiz 'supervisor.log'
$pastaDados = Join-Path $raiz 'dados'
$arquivoPid = Join-Path $pastaDados 'supervisor.pid'

. (Join-Path $PSScriptRoot 'processos.ps1')

New-Item -ItemType Directory -Force -Path $pastaDados | Out-Null

function Registrar($texto) {
  "$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')  $texto" |
    Out-File -FilePath $logSup -Append -Encoding utf8
}

# Trava 1: nao abre dois supervisores.
$supervisorVivo = Ler-PidVivo $arquivoPid 'powershell'
if ($supervisorVivo) {
  Registrar "ja existe um supervisor rodando (PID $supervisorVivo); saindo"
  exit 0
}

# Trava 2: nao inicia um segundo bot se ja houver um node rodando.
$botVivo = Ler-PidVivo (Join-Path $pastaDados 'bot.pid') 'node'
if ($botVivo) {
  Registrar "ja existe um bot rodando (PID $botVivo); saindo"
  exit 0
}

# Rotaciona os logs grandes para nao crescerem sem limite.
foreach ($arquivo in @($log, $logErro)) {
  if ((Test-Path $arquivo) -and ((Get-Item $arquivo).Length -gt 5MB)) {
    Move-Item -Path $arquivo -Destination "$arquivo.1" -Force
  }
}

Gravar-Pid -Arquivo $arquivoPid -Id $PID -ComInicio

try {
  Set-Location $raiz
  Registrar "supervisor iniciado (PID $PID)"

  $espera = 5

  while ($true) {
    $inicio = Get-Date
    Registrar 'iniciando node src\index.js'

    & cmd.exe /c "node src\index.js 1>>bot.log 2>>bot.err.log"
    $codigo = $LASTEXITCODE

    $duracao = [int]((Get-Date) - $inicio).TotalSeconds
    Registrar "node terminou (codigo $codigo) apos ${duracao}s; religando em ${espera}s"

    Start-Sleep -Seconds $espera

    # Se ficou de pe por um tempo, volta ao intervalo curto.
    # Se caiu rapido varias vezes, espera mais para nao fazer loop de crash.
    if ($duracao -ge 20) {
      $espera = 5
    } else {
      $espera = [Math]::Min($espera * 2, 30)
    }
  }
} finally {
  Remove-Item -Path $arquivoPid -Force -ErrorAction SilentlyContinue
  Registrar 'supervisor encerrado'
}
