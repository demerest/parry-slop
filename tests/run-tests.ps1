# Parry Slop test runner — headless Chrome is the JS runtime on this machine.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tests\run-tests.ps1 [-Shots]
param([switch]$Shots)

$ErrorActionPreference = "Stop"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root = (Split-Path -Parent $PSScriptRoot) -replace '\\', '/'
$d = Join-Path $env:TEMP "ps-test"
New-Item -ItemType Directory -Force -Path $d | Out-Null
Add-Type -AssemblyName System.Web

function Run-Chrome([string[]]$extra, [string]$stdoutFile) {
  $ud = Join-Path $d ("ud-" + [guid]::NewGuid().ToString("N"))
  $argList = @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', ('--user-data-dir=' + $ud)) + $extra
  $errFile = $stdoutFile + ".err.txt"
  $p = Start-Process -FilePath $chrome -ArgumentList $argList -Wait -PassThru -RedirectStandardOutput $stdoutFile -RedirectStandardError $errFile
  return $p.ExitCode
}

$harnessOut = Join-Path $d "harness-out.html"
$code = Run-Chrome @('--virtual-time-budget=20000', '--timeout=80000', '--dump-dom', ('file:///' + $root + '/tests/harness.html')) $harnessOut
$h = [System.IO.File]::ReadAllText($harnessOut)
$m = [regex]::Match($h, '(?s)<pre id="out"[^>]*>(.*?)</pre>')
if ($m.Success) {
  [System.Web.HttpUtility]::HtmlDecode($m.Groups[1].Value)
} else {
  "NO RESULTS (chrome exit $code) — check $harnessOut.err.txt"
}

if ($Shots) {
  $shotList = @(
    @{ url = 'index.html';                    size = '1280,800'; name = 'title-desktop' },
    @{ url = 'tests/shot.html?scene=play';     size = '1280,800'; name = 'play-desktop' },
    @{ url = 'tests/shot.html?scene=over';     size = '1280,800'; name = 'over-desktop' },
    @{ url = 'tests/shot.html?scene=settings'; size = '1280,800'; name = 'settings-desktop' },
    @{ url = 'tests/shot.html?scene=play';     size = '500,900';  name = 'play-mobile' },
    @{ url = 'index.html';                    size = '500,900';  name = 'title-mobile' }
  )
  foreach ($s in $shotList) {
    $png = Join-Path $d ($s.name + '.png')
    $log = Join-Path $d ($s.name + '.log')
    $url = 'file:///' + $root + '/' + $s.url
    $null = Run-Chrome @(('--screenshot=' + $png), ('--window-size=' + $s.size), '--virtual-time-budget=6000', '--timeout=30000', $url) $log
    if (Test-Path $png) { "SHOT $($s.name): $png ($((Get-Item $png).Length) bytes)" }
    else { "SHOT $($s.name): FAILED" }
  }
}
