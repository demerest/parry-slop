param([string]$Out = "")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if ($Out -eq "") { $Out = Join-Path $root "publish\itch\parry-slop.zip" }
# Compress-Archive (PS 5.1) writes backslash entry names; Linux extractors (itch.io)
# then see "src\audio.js" as one flat filename and every src/ request 404s.
$files = @(
  "index.html", "LICENSE",
  "src/core.js", "src/audio.js", "src/attacks.js", "src/game.js", "src/render.js", "src/main.js"
)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$outDir = Split-Path -Parent $Out
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
if (Test-Path $Out) { Remove-Item $Out -Force }
$zip = [System.IO.Compression.ZipFile]::Open($Out, [System.IO.Compression.ZipArchiveMode]::Create)
foreach ($rel in $files) {
  $full = Join-Path $root ($rel -replace "/", "\")
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $full, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}
$zip.Dispose()
$check = [System.IO.Compression.ZipFile]::OpenRead($Out)
$names = @($check.Entries | ForEach-Object { $_.FullName })
$check.Dispose()
$bad = @($names | Where-Object { $_ -like "*\*" })
if ($bad.Count -gt 0) { throw "backslash entry names: $($bad -join ', ')" }
Write-Output ("ZIP " + $Out + " " + (Get-Item $Out).Length + " bytes")
$names | ForEach-Object { Write-Output ("  " + $_) }
