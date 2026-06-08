#!/usr/bin/env bash
# Revelor MCP — one-line installer for macOS / Linux
# Usage:
#   bash <(curl -sSL https://raw.githubusercontent.com/Webotvurci-s-r-o/mcp-revelor/main/install.sh)
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Revelor MCP installer ===${NC}"
echo ""

# Detect OS + config path
case "$(uname)" in
    Darwin)  CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json" ;;
    Linux)   CONFIG="$HOME/.config/Claude/claude_desktop_config.json" ;;
    *)
        echo -e "${RED}Nepodporovany OS: $(uname). Na Windows pouzij install.ps1.${NC}"
        exit 1
        ;;
esac

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Node.js neni nainstalovany.${NC}"
    echo "Stahni LTS verzi z https://nodejs.org a pak skript spust znovu."
    exit 1
fi
NODE_VER=$(node --version)
echo -e "${GREEN}✓${NC} Node.js detekovan: $NODE_VER"

# Check Python (for JSON manipulation)
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}python3 neni nainstalovany (potreba pro JSON manipulaci).${NC}"
    exit 1
fi

# Prompt for token (hidden input)
echo ""
echo "Otevri Revelor dashboard → tab '🤖 API tokeny pro agenty' → '+ Novy token'"
echo "Po vygenerovani zkopiruj token (zacina 'rvlr_'):"
echo ""
read -r -s -p "API token: " TOKEN
echo ""
if [[ ! "$TOKEN" =~ ^rvlr_ ]]; then
    echo -e "${RED}Token musi zacinat 'rvlr_'.${NC}"
    exit 1
fi

# Prompt for base URL
read -r -p "Revelor base URL (napr. https://moje-shop.revelor.cz): " BASE_URL
if [[ ! "$BASE_URL" =~ ^https?:// ]]; then
    echo -e "${RED}URL musi zacinat 'http://' nebo 'https://'.${NC}"
    exit 1
fi

# Prompt for entry name (optional, default 'mcp-revelor')
read -r -p "Nazev MCP zaznamu v configu [mcp-revelor]: " ENTRY_NAME
ENTRY_NAME="${ENTRY_NAME:-mcp-revelor}"

# Create config directory
CONFIG_DIR=$(dirname "$CONFIG")
mkdir -p "$CONFIG_DIR"

# Backup existing config (timestamped)
if [ -f "$CONFIG" ]; then
    BACKUP="${CONFIG}.backup-$(date +%Y%m%d-%H%M%S)"
    cp "$CONFIG" "$BACKUP"
    echo -e "${GREEN}✓${NC} Backup vytvoren: $BACKUP"
fi

# Modify config via Python (handles JSON safely + preserves other entries)
REVELOR_TOKEN="$TOKEN" \
REVELOR_URL="$BASE_URL" \
REVELOR_ENTRY="$ENTRY_NAME" \
REVELOR_CONFIG="$CONFIG" \
python3 - <<'PYEOF'
import json, os, sys

config_path = os.environ["REVELOR_CONFIG"]
entry = os.environ["REVELOR_ENTRY"]
token = os.environ["REVELOR_TOKEN"]
url = os.environ["REVELOR_URL"]

cfg = {}
if os.path.exists(config_path):
    try:
        with open(config_path, "r") as f:
            content = f.read().strip()
            cfg = json.loads(content) if content else {}
    except json.JSONDecodeError:
        print(f"WARN: Existing config is not valid JSON, starting fresh.")
        cfg = {}

cfg.setdefault("mcpServers", {})[entry] = {
    "command": "npx",
    "args": ["-y", "github:Webotvurci-s-r-o/mcp-revelor"],
    "env": {
        "REVELOR_API_KEY": token,
        "REVELOR_BASE_URL": url,
    },
}

with open(config_path, "w") as f:
    json.dump(cfg, f, indent=2, ensure_ascii=False)

print(f"OK: '{entry}' added to {config_path}")
PYEOF

echo ""
echo -e "${GREEN}✓${NC} Config aktualizovan: $CONFIG"
echo ""
echo -e "${YELLOW}Nyni:${NC}"
echo "  1. Zavri Claude Desktop UPLNE (system tray → Quit, ne jen zavrit okno)"
echo "  2. Spust ho znovu"
echo "  3. V nove konverzaci zkus napsat: 'Pouzij Revelor MCP, zavolej health'"
echo ""
echo -e "${GREEN}Hotovo!${NC} 🎉"
