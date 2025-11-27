$sourceTemplate = 'C:\Users\ALISON\Documents\foreverpages\scripts\template-to-fix\Light Template'
$tmp = Join-Path $env:TEMP ([guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item -Path (Join-Path $sourceTemplate 'package.json') -Destination $tmp -Force
Write-Output "Temp workspace: $tmp"
Push-Location $tmp
pnpm install --silent
pnpm exec tsc --noEmit -p (Join-Path $sourceTemplate 'tsconfig.json')
$ec = $LASTEXITCODE
Pop-Location
Remove-Item -Recurse -Force $tmp
Write-Output "EXIT:$ec"
exit $ec
