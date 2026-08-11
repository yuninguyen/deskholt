param(
    [string]$Command
)

$nodePath = "d:\DeskHolt\.node"
$env:PATH = "$nodePath;$env:PATH"

Write-Host "Running command with Node PATH..."
Invoke-Expression $Command
