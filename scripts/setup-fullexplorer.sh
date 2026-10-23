#!/usr/bin/env bash
# ==============================================================================
# AMZ FullExplorer (w8io) Setup Script
# ==============================================================================
# Sets up the SQL-backed lightweight FullExplorer (deemru/w8io) for AMZ Blockchain,
# configuring the interface, endpoints, tokens, and networks.
# ==============================================================================

set -euo pipefail

# Output coloring helpers
color_primary="\033[1;32m"   # Emerald Green
color_accent="\033[1;36m"    # Teal/Cyan
color_warning="\033[1;33m"   # Yellow
color_error="\033[1;31m"     # Red
color_bold="\033[1m"         # Bold
color_reset="\033[0m"

log_info() {
    echo -e "${color_primary}[INFO]${color_reset} $1"
}

log_success() {
    echo -e "${color_accent}[SUCCESS]${color_reset} $1"
}

log_warning() {
    echo -e "${color_warning}[WARNING]${color_reset} $1"
}

log_error() {
    echo -e "${color_error}[ERROR]${color_reset} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/../fullexplorer"

echo -e "${color_primary}"
echo "======================================================================"
echo "          AMZ - FULLEXPLORER AUTOMATED SETUP SCRIPT                   "
echo "======================================================================"
echo -e "${color_reset}"

# 1. Verification of system requirements
log_info "Verifying system dependencies..."
for cmd in git php sed curl; do
    if ! command -v "$cmd" &> /dev/null; then
        log_error "Required command '$cmd' is not installed. Please install it first."
        exit 1
    fi
done
log_success "All system dependencies are present."

cd "$TARGET_DIR"

# 2. Handle Configuration creation
log_info "Configuring AMZ environment variables in config.php..."

if [ -f "config.sample.php" ] && [ ! -f "config.php" ]; then
    cp config.sample.php config.php
    log_info "Created config.php from config.sample.php."
elif [ ! -f "config.php" ]; then
    cat << 'EOF' > config.php
<?php
require_once __DIR__ . '/include/w8_error_handler.php';
require_once __DIR__ . '/vendor/autoload.php';
use deemru\WavesKit;

date_default_timezone_set( 'UTC' );

function wk( $full = true ) : WavesKit
{
    static $wk;
    if( !isset( $wk ) )
    {
        $wk = new WavesKit( W8IO_NETWORK, [ 'w', 'e', 'i', 's' ] );
        if( $full )
        {
            define( 'WK_CURL_SETBESTONERROR', true );
            $wk->setNodeAddress( W8IO_NODES, 0 );
            $wk->setCryptash( 'AMZ_SECRET_STRING_KEY' );
        }
    }
    return $wk;
}

function mwk()
{
    static $wk;
    if( !isset( $wk ) )
    {
        $wk = new WavesKit( W8IO_NETWORK, [ 'w', 'e', 'i', 's' ] );
        $nodes = W8IO_MULTI_NODES;
        shuffle( $nodes );
        $wk->setNodeAddress( $nodes, 0 );
    }
    return $wk;
}

function w8_err( $message = '(no message)' )
{
    if( isset( $_SERVER['REQUEST_URI'] ) )
        $message .= ' (' . $_SERVER['REQUEST_URI'] . ')';
    trigger_error( $message, E_USER_ERROR );
}

define( 'W8IO_DB_DIR', __DIR__ . '/var/db/' );
define( 'W8IO_DB_PATH', W8IO_DB_DIR . 'blockchain.sqlite3' );
define( 'W8DB', 'sqlite:' . W8IO_DB_PATH );

define( 'W8IO_NODES', [ 'https://nodes.amzexplorer.com/' ] );
define( 'W8IO_MULTI_NODES', [ 'https://nodes.amzexplorer.com/' ] );
define( 'W8IO_MATCHER', 'https://matcher.amzexplorer.com' );
define( 'W8IO_NETWORK', 'A' ); // 'A' -- AMZ mainnet
define( 'W8IO_ROOT', '/' );
define( 'W8IO_MAX_UPDATE_BATCH', 1 );
define( 'W8IO_UPDATE_DELAY', 1 );
define( 'W8IO_UPDATE_PROCS', 1 );
define( 'WK_CURL_TIMEOUT', 15 );
define( 'W8IO_MAX_MEMORY', 1024 * 1024 * 1024 );
EOF
fi

log_success "AMZ FullExplorer configuration updated."
