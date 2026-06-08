# Revelor MCP — one-line installer for Windows (PowerShell)
# Usage:
#   iwr -useb https://raw.githubusercontent.com/Webotvurci-s-r-o/mcp-revelor/main/install.ps1 | iex
#
# Kompatibilita: Windows PowerShell 5.1 (Win10/11 default) i PowerShell 7+.
# Detekuje obe varianty Claude Desktop: Microsoft Store (MSIX, sandboxed)
# i standardni .exe installer.

$ErrorActionPreference = "Stop"

function Write-Color($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

# Convert PSCustomObject (z ConvertFrom-Json) na OrderedDictionary
# rekurzivne — abychom mohli pridavat / cist klice jednotne.
function ConvertTo-OrderedDict {
    param($InputObject)
    if ($null -eq $InputObject) { return [ordered]@{} }
    $dict = [ordered]@{}
    foreach ($prop in $InputObject.PSObject.Properties) {
        if ($prop.Value -is [PSCustomObject]) {
            $dict[$prop.Name] = ConvertTo-OrderedDict $prop.Value
        } else {
            $dict[$prop.Name] = $prop.Value
        }
    }
    return $dict
}

# Najde skutecnou cestu, kterou ctena varianta Claude Desktop pouziva.
# Microsoft Store (MSIX) verze bezi v sandboxu a cte z LocalCache, nikoliv
# z %APPDATA%\Claude\. Pokud bychom zapsali do standardni cesty, MSIX appka
# ho nikdy nenajde a zadny MCP server nenahraje — proto tato detekce.
function Find-ClaudeConfigPath {
    # 1) MSIX (Microsoft Store) Claude — package_<hash> folder pod LOCALAPPDATA\Packages\
    $msixCandidates = Get-ChildItem "$env:LOCALAPPDATA\Packages" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'Claude_*' }
    foreach ($pkg in $msixCandidates) {
        $sandboxPath = Join-Path $pkg.FullName "LocalCache\Roaming\Claude\claude_desktop_config.json"
        $sandboxDir = Split-Path $sandboxPath
        if (Test-Path $sandboxDir) {
            return [PSCustomObject]@{
                Path = $sandboxPath
                Variant = "Microsoft Store (MSIX, sandboxed)"
            }
        }
    }
    # 2) Standardni .exe installer — %APPDATA%\Claude\
    return [PSCustomObject]@{
        Path = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"
        Variant = "Standardni (.exe installer)"
    }
}

Write-Color "=== Revelor MCP installer ===" Cyan
Write-Host ""

# Detekce Claude Desktop varianty + spravna cesta
$claudeInfo = Find-ClaudeConfigPath
$config = $claudeInfo.Path
Write-Color "OK Claude Desktop detekovan: $($claudeInfo.Variant)" Green
Write-Host "   Config bude zapsan do: $config"

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Color "Node.js neni nainstalovany." Red
    Write-Host "Stahni LTS verzi z https://nodejs.org a spust skript znovu."
    exit 1
}
$nodeVer = & node --version
Write-Color "OK Node.js detekovan: $nodeVer" Green

# Prompt for token
Write-Host ""
Write-Host "Otevri Revelor dashboard -> tab 'API tokeny pro agenty' -> '+ Novy token'"
Write-Host "Po vygenerovani zkopiruj token (zacina 'rvlr_'):"
Write-Host ""

$tokenSecure = Read-Host "API token (skryto)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSecure)
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ($token -notmatch '^rvlr_') {
    Write-Color "Token musi zacinat 'rvlr_'." Red
    exit 1
}

# Prompt for URL
$baseUrl = Read-Host "Revelor base URL (napr. https://moje-shop.revelor.cz)"
if ($baseUrl -notmatch '^https?://') {
    Write-Color "URL musi zacinat 'http://' nebo 'https://'." Red
    exit 1
}

# Prompt for entry name (Enter = pouzij default)
Write-Host ""
Write-Host "Nazev MCP zaznamu v configu (Enter = ponechat 'mcp-revelor'):"
$entryName = Read-Host
if ([string]::IsNullOrWhiteSpace($entryName)) { $entryName = "mcp-revelor" }

# Create config directory
$configDir = Split-Path $config
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Backup existing config
if (Test-Path $config) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backup = "$config.backup-$timestamp"
    Copy-Item $config $backup
    Write-Color "OK Backup vytvoren: $backup" Green
}

# Read existing config (parse via PSCustomObject — funguje v PS 5.1 i 7+)
$cfg = [ordered]@{}
if (Test-Path $config) {
    try {
        $content = Get-Content $config -Raw -Encoding UTF8
        if (-not [string]::IsNullOrWhiteSpace($content)) {
            $parsed = $content | ConvertFrom-Json -ErrorAction Stop
            $cfg = ConvertTo-OrderedDict $parsed
        }
    } catch {
        Write-Color "WARN: Existing config neni validni JSON, startuju cisty." Yellow
        $cfg = [ordered]@{}
    }
}

# Ensure mcpServers exists (.Contains funguje na hashtable i OrderedDictionary)
if (-not $cfg.Contains("mcpServers")) {
    $cfg["mcpServers"] = [ordered]@{}
}

# Add/update entry
$cfg["mcpServers"][$entryName] = [ordered]@{
    command = "npx"
    args = @("-y", "github:Webotvurci-s-r-o/mcp-revelor")
    env = [ordered]@{
        REVELOR_API_KEY = $token
        REVELOR_BASE_URL = $baseUrl
    }
}

# Write back — UTF-8 BEZ BOM
# (PS 5.1 default `Out-File -Encoding utf8` vlozi BOM, Claude Desktop Node.js
# JSON.parse to neumi a tise selze -> zadny MCP server se nenahraje.)
$jsonOutput = $cfg | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($config, $jsonOutput, (New-Object System.Text.UTF8Encoding($false)))

# Clear plain-text token from memory ASAP
$token = $null
[System.GC]::Collect()

Write-Host ""
Write-Color "===========================================================" Green
Write-Color "  HOTOVO - config zapsan." Green
Write-Color "===========================================================" Green
Write-Host ""
Write-Host "Cesta: $config"
Write-Host ""
Write-Color "Co udelat ted (presne):" Yellow
Write-Host ""
Write-Host "  1) Ukoncit Claude Desktop UPLNE:"
Write-Host "     - Stisknout Ctrl+Shift+Esc (Task Manager)"
Write-Host "     - Najit vsechny radky 's nazvem 'Claude' (muze jich byt nekolik)"
Write-Host "     - Kliknout pravym -> End task na kazdy"
Write-Host "     (Pouhe zavreni okna 'X' nestaci - bezi dal v tray.)"
Write-Host ""
Write-Host "  2) Spustit Claude Desktop znovu (Start menu -> Claude)"
Write-Host ""
Write-Host "  3) Otevri NOVOU konverzaci a napis:"
Write-Host "     'Pouzij Revelor MCP, zavolej health'"
Write-Host ""
Write-Host "  Pri prvnim spusteni stahne npx balicek mcp-revelor (cca 10s)."
Write-Host ""
Write-Color "===========================================================" Cyan
Write-Color "  POKUD by Claude Desktop MCP nenasel, vloz config rucne:" Cyan
Write-Color "===========================================================" Cyan
Write-Host ""
Write-Host "  1) Otevri tento soubor v Notepadu:"
Write-Host "     $config"
Write-Host ""
Write-Host "  2) Mel by obsahovat (s tvym tokenem + URL):"
Write-Host ""
Get-Content $config | ForEach-Object { Write-Host "     $_" }
Write-Host ""
Write-Host "  3) Pokud chybi, vloz vyse uvedeny obsah, uloz, restartuj Claude."
Write-Host ""
