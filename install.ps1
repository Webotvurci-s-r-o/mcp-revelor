# Revelor MCP — one-line installer for Windows (PowerShell)
# Usage:
#   iwr -useb https://raw.githubusercontent.com/Webotvurci-s-r-o/mcp-revelor/main/install.ps1 | iex
#
# Kompatibilita: Windows PowerShell 5.1 (Win10/11 default) i PowerShell 7+.

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

Write-Color "=== Revelor MCP installer ===" Cyan
Write-Host ""

# Config path on Windows
$config = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"

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

# Pokud mcpServers prislo z JSON jako neco jineho nez OrderedDictionary,
# nech ho byt — Pridat klic ale ne prepisovat strukturu.
# (Vyjimka: pokud je to PSCustomObject, prevedeme — to uz delame v ConvertTo-OrderedDict.)

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
Write-Color "OK Config aktualizovan: $config" Green
Write-Host ""
Write-Color "=== Dalsi kroky ===" Cyan
Write-Host ""
Write-Color "1. Ukoncit Claude Desktop UPLNE (ne jen zavrit okno)" Yellow
Write-Host "   - V system tray (vpravo dole, vedle hodin) najdi ikonu Claude"
Write-Host "   - Klikni pravym -> Quit / Ukoncit"
Write-Host "   - POZOR: pouhe zavreni okna (X) ho nevypne, bezi dal v tray"
Write-Host "   - Pripadne pres Task Manager: ukoncit vsechny 'Claude.exe' procesy"
Write-Host ""
Write-Color "2. Spustit Claude Desktop znovu" Yellow
Write-Host "   - Pri prvnim spusteni stahne npx automaticky balicek mcp-revelor"
Write-Host "     (cca 5-30 sekund podle rychlosti internetu)"
Write-Host ""
Write-Color "3. Overit ze MCP server bezi" Yellow
Write-Host "   - Otevri novou konverzaci"
Write-Host "   - Dole v chat vstupnim poli klikni na ikonu se 'sliderem' / 'pluginy'"
Write-Host "     (Settings & tools -> Connectors / Tools)"
Write-Host "   - Mel bys videt 'mcp-revelor' v seznamu pripojenych nastroju"
Write-Host "   - Pokud tam neni: viz Troubleshooting nize"
Write-Host ""
Write-Color "4. Vyzkousej dotaz" Yellow
Write-Host "   - Napis: 'Pouzij Revelor MCP, zavolej health'"
Write-Host "   - Claude zavola nastroj a vrati zdravotni stav e-shopu"
Write-Host ""
Write-Color "=== Troubleshooting ===" Cyan
Write-Host ""
Write-Host "Pokud Claude Desktop nezobrazi mcp-revelor v Tools:"
Write-Host ""
Write-Host "  a) Overit ze config je validni JSON:"
Write-Host "     Get-Content '$config' | ConvertFrom-Json"
Write-Host "     (Mel by vypsat strukturu bez chyby)"
Write-Host ""
Write-Host "  b) Mrknout do logu Claude Desktop:"
Write-Host "     `$env:APPDATA\Claude\logs\"
Write-Host "     Hledat 'mcp-revelor' nebo 'mcp' v souborech mcp*.log"
Write-Host ""
Write-Host "  c) Manualne overit npx:"
Write-Host "     npx -y github:Webotvurci-s-r-o/mcp-revelor --help"
Write-Host "     (Pokud selze, problem je v Node.js / npm konfiguraci)"
Write-Host ""
Write-Host "  d) Backup configu byl ulozen do:"
Write-Host "     $config.backup-*"
Write-Host ""
Write-Color "Hotovo!" Green
