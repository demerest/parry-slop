param(
  [string]$Scene = "title",
  [string]$Out = ""
)
$ErrorActionPreference = "Stop"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root = Split-Path -Parent $PSScriptRoot
if ($Out -eq "") { $Out = Join-Path $env:TEMP ("ps-itch\cover-" + $Scene + ".png") }
$tmp = Join-Path $env:TEMP ("ps-itch-shot-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null
$raw = Join-Path $tmp "raw.png"
$url = "file:///" + ($root -replace "\\", "/") + "/tests/shot.html?scene=" + $Scene
$chromeArgs = @(
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
  ("--user-data-dir=" + $tmp),
  "--window-size=1260,1000",
  ("--screenshot=" + $raw),
  "--virtual-time-budget=3000",
  "--timeout=12000",
  $url
)
Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -PassThru `
  -RedirectStandardOutput (Join-Path $tmp "out.txt") `
  -RedirectStandardError (Join-Path $tmp "err.txt") | Out-Null
if (-not (Test-Path $raw)) { throw "no screenshot produced for scene $Scene" }
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($raw)
$w = $src.Width; $h = $src.Height
$bmp = New-Object System.Drawing.Bitmap 630, 500
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, 0, 0, 630, 500)
$g.Dispose()
$src.Dispose()
$outDir = Split-Path -Parent $Out
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("COVER " + $Out + " 630x500 downscaled from " + $w + "x" + $h)
