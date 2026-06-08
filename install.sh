#!/usr/bin/env bash
# Revelor MCP — one-liner installer (macOS / Linux)
# Usage:
#   bash <(curl -sSL https://raw.githubusercontent.com/Webotvurci-s-r-o/mcp-revelor/main/install.sh)
#
# Tento skript pouze vygeneruje hotovy MCP config a vloží ho do schránky
# (pbcopy/xclip/wl-copy). Skutečné "zapojení" do Claude Desktop uděláš
# v dalším kroku (Settings → Developer → Edit Config → ⌘V / Ctrl+V) —
# Claude sám zná správnou cestu pro tvou variantu.

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

echo -e "${BLUE}=== Revelor MCP installer (Krok 1) ===${NC}"
echo ""

# Check Node.js (warn but allow continue)
if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW}POZOR: Node.js neni detekovany.${NC}"
    echo "  Stáhni LTS verzi z https://nodejs.org a restartuj terminál."
    echo "  Bez Node.js MCP server nepůjde spustit, ale config připravit můžeš."
    echo ""
    read -r -p "Pokračovat přesto a vygenerovat config? (a/N): " CONT
    if [[ "$CONT" != "a" && "$CONT" != "A" && "$CONT" != "y" && "$CONT" != "Y" ]]; then
        exit 1
    fi
else
    NODE_VER=$(node --version)
    echo -e "${GREEN}OK${NC} Node.js detekovan: $NODE_VER"
fi

# Check python3 (for JSON building)
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}python3 neni nainstalovany (potřeba pro generování JSON).${NC}"
    exit 1
fi

# Prompt for token (hidden)
echo ""
echo "V Revelor dashboardu otevři tab 'API tokeny pro agenty'"
echo "Klikni '+ Nový token' a zkopíruj výsledný token (začíná 'rvlr_'):"
echo ""
read -r -s -p "API token (skryto): " TOKEN
echo ""
if [[ ! "$TOKEN" =~ ^rvlr_ ]]; then
    echo -e "${RED}Token musí začínat 'rvlr_'.${NC}"
    exit 1
fi

# Prompt for base URL
read -r -p "Revelor base URL (např. https://moje-shop.revelor.cz): " BASE_URL
if [[ ! "$BASE_URL" =~ ^https?:// ]]; then
    echo -e "${RED}URL musí začínat 'http://' nebo 'https://'.${NC}"
    exit 1
fi

# Build JSON via Python
JSON_OUTPUT=$(REVELOR_TOKEN="$TOKEN" REVELOR_URL="$BASE_URL" python3 - <<'PYEOF'
import json, os
cfg = {
    "mcpServers": {
        "mcp-revelor": {
            "command": "npx",
            "args": ["-y", "github:Webotvurci-s-r-o/mcp-revelor"],
            "env": {
                "REVELOR_API_KEY": os.environ["REVELOR_TOKEN"],
                "REVELOR_BASE_URL": os.environ["REVELOR_URL"],
            },
        }
    }
}
print(json.dumps(cfg, indent=2, ensure_ascii=False))
PYEOF
)

# Forget plain-text token
TOKEN=""
unset TOKEN

# Try to copy to clipboard
CLIPBOARD_TOOL="none"
if command -v pbcopy >/dev/null 2>&1; then
    printf '%s' "$JSON_OUTPUT" | pbcopy
    CLIPBOARD_TOOL="pbcopy"
elif command -v wl-copy >/dev/null 2>&1; then
    printf '%s' "$JSON_OUTPUT" | wl-copy
    CLIPBOARD_TOOL="wl-copy"
elif command -v xclip >/dev/null 2>&1; then
    printf '%s' "$JSON_OUTPUT" | xclip -selection clipboard
    CLIPBOARD_TOOL="xclip"
elif command -v xsel >/dev/null 2>&1; then
    printf '%s' "$JSON_OUTPUT" | xsel --clipboard --input
    CLIPBOARD_TOOL="xsel"
fi

echo ""
echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  KROK 1 HOTOVO${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""
if [ "$CLIPBOARD_TOOL" != "none" ]; then
    echo -e "${GREEN}OK${NC} Config je ve schránce (přes ${CLIPBOARD_TOOL}). V Kroku 2 stačí ⌘V / Ctrl+V."
else
    echo -e "${YELLOW}Schránka nedostupná (chybí pbcopy/xclip/xsel/wl-copy).${NC}"
    echo "  Použij config vypsaný níže ('Tvůj config') — copy-paste ručně."
fi
echo ""
echo -e "${CYAN}===========================================================${NC}"
echo -e "${CYAN}  KROK 2 — vlož config do Claude Desktop${NC}"
echo -e "${CYAN}===========================================================${NC}"
echo ""
echo "  1) Otevři Claude Desktop"
echo ""
echo "  2) Klikni na své jméno / 'Settings' (vlevo dole)"
echo "     → v levé liště vyber kartu 'Developer'"
echo ""
echo "  3) Klikni na tlačítko 'Edit Config'"
echo "     (Claude sám otevře 'claude_desktop_config.json' v editoru)"
echo ""
echo "  4) Smaž celý obsah souboru (⌘A / Ctrl+A, Delete)"
echo "     a vlož config ze schránky (⌘V / Ctrl+V)"
echo ""
echo "     Pokud už máš v Claude jiné MCP servery, místo 'smaž vše'"
echo "     přidej jen blok 'mcp-revelor' dovnitř existující sekce"
echo "     'mcpServers' { ... }."
echo ""
echo "  5) Ulož (⌘S / Ctrl+S) a zavři editor"
echo ""
echo "  6) Restartuj Claude Desktop ÚPLNĚ:"
echo "     - macOS: ⌘Q nebo Claude → Quit Claude, pak spustit znovu"
echo "     - Linux: zavřít okno + 'kill' všechny Claude procesy (htop / Activity Monitor)"
echo ""
echo "  7) V nové konverzaci napiš:"
echo "     'Použij Revelor MCP, zavolej health'"
echo ""
echo -e "${GRAY}===========================================================${NC}"
echo -e "${GRAY}  Tvůj config (kdyby schránka nezkopírovala):${NC}"
echo -e "${GRAY}===========================================================${NC}"
echo ""
echo "$JSON_OUTPUT" | sed 's/^/  /'
echo ""
