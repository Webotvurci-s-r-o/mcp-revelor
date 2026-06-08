# Revelor MCP — one-liner installer (Windows / PowerShell)
# Usage:
#   iwr -useb https://raw.githubusercontent.com/Webotvurci-s-r-o/mcp-revelor/main/install.ps1 | iex
#
# Tento skript pouze vygeneruje hotovy MCP config a vlozi ti ho do schranky.
# Skutecne 'zapojeni' do Claude Desktop udelas v dalsim kroku (Settings ->
# Developer -> Edit Config -> Ctrl+V) — Claude sam zna spravnou cestu pro
# tvoji verzi (standardni .exe / Microsoft Store / future varianty).
#
# Kompatibilita: Windows PowerShell 5.1 (Win10/11 default) i PowerShell 7+.

$ErrorActionPreference = "Stop"

function Write-Color($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "=== Revelor MCP installer (Krok 1) ===" Cyan
Write-Host ""

# Check Node.js (pripominka; bez Node MCP server nenastartuje, ale config jde
# pripravit i tak — klient si Node muze stahnout pozdeji)
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Color "POZOR: Node.js neni detekovany." Yellow
    Write-Host "  Stahni LTS verzi z https://nodejs.org a restartuj PowerShell."
    Write-Host "  Bez Node.js MCP server nepujde spustit, ale config pripravit muzes."
    Write-Host ""
    $cont = Read-Host "Pokracovat presto a vygenerovat config? (a/N)"
    if ($cont -notmatch '^[aAyY]') { exit 1 }
} else {
    $nodeVer = & node --version
    Write-Color "OK Node.js detekovan: $nodeVer" Green
}

# Prompt for token
Write-Host ""
Write-Host "V Revelor dashboardu otevri tab 'API tokeny pro agenty'"
Write-Host "Klikni '+ Novy token' a zkopiruj vysledny token (zacina 'rvlr_'):"
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

# Build config (vzdy cisty — klient bud nahradi cely soubor, nebo si vlozi
# jen vnitrek 'mcp-revelor' bloku do existujici sekce mcpServers)
$cfg = [ordered]@{
    mcpServers = [ordered]@{
        "mcp-revelor" = [ordered]@{
            command = "npx"
            args = @("-y", "github:Webotvurci-s-r-o/mcp-revelor")
            env = [ordered]@{
                REVELOR_API_KEY = $token
                REVELOR_BASE_URL = $baseUrl
            }
        }
    }
}
$jsonOutput = $cfg | ConvertTo-Json -Depth 10

# Token jiz neni potreba drzet v plain pameti
$token = $null
[System.GC]::Collect()

# Copy to clipboard (Set-Clipboard je v Win PS 5.1+)
$clipboardOk = $false
try {
    $jsonOutput | Set-Clipboard
    $clipboardOk = $true
} catch {
    # Velmi vzacne — PS bez Microsoft.PowerShell.Management modulu
}

Write-Host ""
Write-Color "===========================================================" Green
Write-Color "  KROK 1 HOTOVO" Green
Write-Color "===========================================================" Green
Write-Host ""
if ($clipboardOk) {
    Write-Color "OK Config je ve schrance (clipboard). V dalsim kroku staci Ctrl+V." Green
} else {
    Write-Color "Schranka nedostupna - pouzij config vypsany nize ('Tvuj config')." Yellow
}
Write-Host ""
Write-Color "===========================================================" Cyan
Write-Color "  KROK 2 - vloz config do Claude Desktop" Cyan
Write-Color "===========================================================" Cyan
Write-Host ""
Write-Host "  1) Otevri Claude Desktop"
Write-Host ""
Write-Host "  2) Vlevo dole klikni na sve jmeno / 'Settings'"
Write-Host "     -> v leve liste vyber kartu 'Developer'"
Write-Host ""
Write-Host "  3) Klikni na tlacitko 'Edit Config'"
Write-Host "     (Claude sam otevre 'claude_desktop_config.json' v Notepadu)"
Write-Host ""
Write-Host "  4) Smaz cely obsah souboru (Ctrl+A, Delete)"
Write-Host "     a vloz config ze schranky (Ctrl+V)"
Write-Host ""
Write-Host "     Pokud uz mas v Claude jine MCP servery (napr. Google Drive),"
Write-Host "     misto 'smaz vse' pridej jen blok 'mcp-revelor' dovnitr existujici"
Write-Host "     sekce 'mcpServers' { ... }."
Write-Host ""
Write-Host "  5) Uloz (Ctrl+S) a zavri editor"
Write-Host ""
Write-Host "  6) Restartuj Claude Desktop UPLNE:"
Write-Host "     - Stiskni Ctrl+Shift+Esc (Task Manager)"
Write-Host "     - Najdi vsechny procesy s nazvem 'Claude'"
Write-Host "     - Pravym kliknout -> 'End task' (na kazdy)"
Write-Host "     - Spust Claude znovu (Start menu -> Claude)"
Write-Host ""
Write-Host "  7) V nove konverzaci napis:"
Write-Host "     'Pouzij Revelor MCP, zavolej health'"
Write-Host ""
Write-Color "===========================================================" DarkGray
Write-Color "  Tvuj config (pripadne ze schranky nezkopirovalo):" DarkGray
Write-Color "===========================================================" DarkGray
Write-Host ""
$jsonOutput -split "`n" | ForEach-Object { Write-Host "  $_" }
Write-Host ""
