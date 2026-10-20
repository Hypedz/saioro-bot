# Funcoes compartilhadas pelos scripts de inicializacao/parada.
# O arquivo de PID guarda "PID|ticks de inicio" para nao confundir um PID
# reciclado pelo Windows com o processo que realmente nos interessa.

function Ler-PidVivo {
  param(
    [string] $Arquivo,
    [string] $NomeProcesso
  )

  if (-not (Test-Path $Arquivo)) { return $null }

  $conteudo = Get-Content -Path $Arquivo -Raw -ErrorAction SilentlyContinue
  if (-not $conteudo) { return $null }

  $partes = $conteudo.Trim() -split '\|'
  [int] $id = 0
  if (-not [int]::TryParse($partes[0], [ref] $id)) { return $null }

  $processo = Get-Process -Id $id -ErrorAction SilentlyContinue
  if (-not $processo) { return $null }
  if ($NomeProcesso -and $processo.ProcessName -ne $NomeProcesso) { return $null }

  if ($partes.Count -ge 2 -and $partes[1]) {
    $ticks = $processo.StartTime.ToUniversalTime().Ticks
    if ("$ticks" -ne $partes[1]) { return $null }
  }

  return $processo.Id
}

function Gravar-Pid {
  param(
    [string] $Arquivo,
    [int] $Id,
    [switch] $ComInicio
  )

  if ($ComInicio) {
    $ticks = (Get-Process -Id $Id).StartTime.ToUniversalTime().Ticks
    "$Id|$ticks" | Out-File -FilePath $Arquivo -Encoding ascii
  } else {
    "$Id" | Out-File -FilePath $Arquivo -Encoding ascii
  }
}
