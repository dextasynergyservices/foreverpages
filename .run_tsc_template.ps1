param(
  [string]$TemplatePath = "scripts/template-to-fix/Light Template"
)

$TemplatePath = Resolve-Path -Path $TemplatePath | Select-Object -ExpandProperty Path
$tmp = Join-Path $env:TEMP (Get-Random -Minimum 100000 -Maximum 999999).ToString()
New-Item -ItemType Directory -Path $tmp | Out-Null

# Copy package.json and optional tsconfig
Copy-Item -Path (Join-Path $TemplatePath 'package.json') -Destination $tmp -ErrorAction Stop
if (Test-Path (Join-Path $TemplatePath 'tsconfig.json')) {
  Copy-Item -Path (Join-Path $TemplatePath 'tsconfig.json') -Destination $tmp -ErrorAction SilentlyContinue
}

Push-Location $tmp
Write-Output "Temp workspace: $tmp"
pnpm install --silent
$tsconfigPath = Join-Path $tmp 'tsconfig.json'
if (Test-Path $tsconfigPath) {
  pnpm exec tsc --noEmit --pretty false -p $tsconfigPath
} else {
  Write-Output "No tsconfig.json found in template; skipping tsc"
}
$ec = $LASTEXITCODE
Pop-Location
Remove-Item -Recurse -Force $tmp
Write-Output "EXIT:$ec"