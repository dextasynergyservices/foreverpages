param(
  [string]$TemplateRoot = ".",
  [string]$OutZip = "template-upload.zip"
)

$TemplateRoot = Resolve-Path -Path $TemplateRoot | Select-Object -ExpandProperty Path
$pkgDir = Join-Path $TemplateRoot "template-package"

if (Test-Path $pkgDir) { Remove-Item -Recurse -Force $pkgDir }
New-Item -ItemType Directory -Path $pkgDir | Out-Null

$items = @("config.json", "MemorialTemplate.tsx", "tsconfig.json", "package.json")
foreach ($i in $items) {
  $p = Join-Path $TemplateRoot $i
  if (Test-Path $p) {
    if ($i -ne ".vscode") {
      Copy-Item -Path $p -Destination $pkgDir -ErrorAction SilentlyContinue
    }
  }
}

# copy folders
foreach ($d in @("src","public")) {
  $src = Join-Path $TemplateRoot $d
  if (Test-Path $src) {
    # Exclude .vscode folders if present inside these trees
    Copy-Item -Path $src -Destination $pkgDir -Recurse -ErrorAction SilentlyContinue
    Get-ChildItem -Path (Join-Path $pkgDir $d) -Recurse -Force |
      Where-Object { $_.PSIsContainer -and $_.Name -eq '.vscode' } |
      ForEach-Object { Remove-Item -Recurse -Force $_.FullName }
  }
}

# assets
foreach ($a in @("preview.png","thumbnail.png")) {
  $p = Join-Path $TemplateRoot $a
  if (Test-Path $p) {
    Copy-Item -Path $p -Destination $pkgDir -ErrorAction SilentlyContinue
  }
}

# make zip
$zipPath = Join-Path $TemplateRoot $OutZip
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
# Ensure .vscode is not included in the zip even if present
Get-ChildItem -Path $pkgDir -Recurse -Force |
  Where-Object { $_.FullName -match '\.vscode' } |
  ForEach-Object { Remove-Item -Recurse -Force $_.FullName }
Compress-Archive -Path (Join-Path $pkgDir "*") -DestinationPath $zipPath -Force
Write-Output "Packaged $zipPath"
