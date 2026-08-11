$nodeDir = 'd:\DeskHolt\.node'
if (-not (Test-Path "$nodeDir\node.exe")) {
    Write-Host "Downloading portable Node.js..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $url = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
    $zip = "d:\DeskHolt\node.zip"
    Invoke-WebRequest -Uri $url -OutFile $zip
    Write-Host "Extracting..."
    Expand-Archive -Path $zip -DestinationPath "d:\DeskHolt\temp_node" -Force
    if (-not (Test-Path $nodeDir)) { New-Item -ItemType Directory -Path $nodeDir -Force | Out-Null }
    Copy-Item -Path "d:\DeskHolt\temp_node\node-v20.18.0-win-x64\*" -Destination $nodeDir -Recurse -Force
    Remove-Item -Force $zip
    Remove-Item -Recurse -Force "d:\DeskHolt\temp_node"
}

Write-Host "Node version:"
& "$nodeDir\node.exe" -v
Write-Host "NPM version:"
& "$nodeDir\npm.cmd" -v
