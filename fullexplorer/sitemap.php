<?php

namespace w8io;

if( !defined( 'W8IO_ROOT' ) )
{
    if( file_exists( __DIR__ . '/config.php' ) )
        require_once __DIR__ . '/config.php';
    else
        require_once __DIR__ . '/config.sample.php';
}

require_once __DIR__ . '/include/common.php';
require_once __DIR__ . '/include/RO.php';

// Clean target parameter
$target = $_GET['type'] ?? $address ?? 'sitemap.xml';
if( strpos( $target, '/' ) !== false )
    $target = basename( $target );

$baseUrl = 'https://fullexplorer.planetone.io';

// Normalize common typo (sitmap.xml -> sitemap.xml)
if( $target === 'sitmap.xml' || $target === 'sitmap' )
    $target = 'sitemap.xml';

// 0. If static pre-generated XML file exists on disk matching target, stream it directly with high performance
$staticFile = __DIR__ . '/' . $target;
if( file_exists( $staticFile ) && is_file( $staticFile ) && substr( $target, -4 ) === '.xml' )
{
    header( 'Content-Type: application/xml; charset=utf-8' );
    header( 'X-Robots-Tag: noindex' );
    readfile( $staticFile );
    exit();
}

header( 'Content-Type: application/xml; charset=utf-8' );
header( 'X-Robots-Tag: noindex' );

// Helper to query remote node safely
function fetchNodeData( $path )
{
    $nodeUrl = defined('W8IO_NODES') && is_array(W8IO_NODES) ? W8IO_NODES[1] ?? W8IO_NODES[0] : 'https://nodes.planetone.io';
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 5,
            'header' => "User-Agent: PlanetOne-FullExplorer-Sitemap/3.0\r\n"
        ]
    ]);
    $res = @file_get_contents( rtrim($nodeUrl, '/') . $path, false, $ctx );
    return $res ? json_decode( $res, true ) : null;
}

$maxHeight = 0;
try {
    $RO = new RO( W8DB );
    if( $RO->isReady )
    {
        $ht = $RO->getLastHeightTimestamp();
        if( $ht !== false )
            $maxHeight = (int)$ht[0];
    }
} catch( \Exception $e ) {}

if( $maxHeight <= 0 )
{
    $heightData = fetchNodeData( '/blocks/height' );
    if( $heightData && isset( $heightData['height'] ) )
        $maxHeight = (int)$heightData['height'];
    else
        $maxHeight = 107354;
}

$MAX_URLS = 10000;
$numBlockChunks = max( 1, (int)ceil( $maxHeight / $MAX_URLS ) );

// 1. Sitemap Index
if( $target === 'sitemap.xml' || $target === 'sitemap' )
{
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    $today = date( 'Y-m-d' );
    echo "  <sitemap>\n    <loc>{$baseUrl}/sitemap-main.xml</loc>\n    <lastmod>{$today}</lastmod>\n  </sitemap>\n";

    for( $i = 1; $i <= $numBlockChunks; $i++ )
    {
        echo "  <sitemap>\n    <loc>{$baseUrl}/sitemap-blocks-{$i}.xml</loc>\n    <lastmod>{$today}</lastmod>\n  </sitemap>\n";
    }

    echo "  <sitemap>\n    <loc>{$baseUrl}/sitemap-transactions-1.xml</loc>\n    <lastmod>{$today}</lastmod>\n  </sitemap>\n";
    echo "  <sitemap>\n    <loc>{$baseUrl}/sitemap-addresses-1.xml</loc>\n    <lastmod>{$today}</lastmod>\n  </sitemap>\n";
    echo "  <sitemap>\n    <loc>{$baseUrl}/sitemap-addresses-2.xml</loc>\n    <lastmod>{$today}</lastmod>\n  </sitemap>\n";

    echo '</sitemapindex>' . "\n";
    exit();
}

// 2. Main Routes Sitemap
if( $target === 'sitemap-main.xml' || $target === 'sitemap-main' )
{
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    $routes = [
        [ 'url' => '/', 'priority' => '1.0', 'changefreq' => 'always' ],
        [ 'url' => '/GENERATORS', 'priority' => '0.9', 'changefreq' => 'always' ],
        [ 'url' => '/top', 'priority' => '0.9', 'changefreq' => 'hourly' ],
        [ 'url' => '/ACTIVATION', 'priority' => '0.8', 'changefreq' => 'daily' ],
    ];

    $now = date( 'Y-m-d' );
    foreach( $routes as $r )
    {
        echo "  <url>\n";
        echo "    <loc>{$baseUrl}{$r['url']}</loc>\n";
        echo "    <lastmod>{$now}</lastmod>\n";
        echo "    <changefreq>{$r['changefreq']}</changefreq>\n";
        echo "    <priority>{$r['priority']}</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>' . "\n";
    exit();
}

// 3. Blocks Sitemaps (Partitioned chunks or legacy alias, max 10.000 blocks each)
if( preg_match( '/^sitemap-blocks(?:-(\d+))?\.xml$/', $target, $matches ) )
{
    $part = isset( $matches[1] ) ? (int)$matches[1] : 1;
    $topH = $maxHeight - ( ( $part - 1 ) * $MAX_URLS );
    $bottomH = max( 1, $maxHeight - ( $part * $MAX_URLS ) + 1 );

    $genesisTs = 1784672365854;
    $avgMsPerBlock = 63398;

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    for( $h = $topH; $h >= $bottomH; $h-- )
    {
        $d = date( 'Y-m-d', (int)(( $genesisTs + ( $h - 1 ) * $avgMsPerBlock ) / 1000) );
        $prio = $h >= $maxHeight - 100 ? '0.9' : ( $h >= $maxHeight - 5000 ? '0.8' : '0.6' );
        echo "  <url>\n";
        echo "    <loc>{$baseUrl}/b/{$h}</loc>\n";
        echo "    <lastmod>{$d}</lastmod>\n";
        echo "    <changefreq>never</changefreq>\n";
        echo "    <priority>{$prio}</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>' . "\n";
    exit();
}

// 4. Transactions Sitemap (Max 10.000)
if( preg_match( '/^sitemap-transactions(?:-(\d+))?\.xml$/', $target, $matches ) )
{
    $part = isset( $matches[1] ) ? (int)$matches[1] : 1;
    $offset = ( $part - 1 ) * $MAX_URLS;

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    $txList = [];
    try {
        $RO = new RO( W8DB );
        if( $RO->isReady )
        {
            $stmt = $RO->db->db->query( "SELECT r0 FROM ts ORDER BY r0 DESC LIMIT {$MAX_URLS} OFFSET {$offset}" );
            if( $stmt )
            {
                while( $row = $stmt->fetch() )
                {
                    $txId = $RO->getTxIdByTxKey( (int)$row[0] );
                    if( $txId )
                        $txList[] = $txId;
                }
            }
        }
    } catch( \Exception $e ) {}

    $today = date( 'Y-m-d' );
    foreach( array_unique( $txList ) as $txId )
    {
        echo "  <url>\n";
        echo "    <loc>{$baseUrl}/tx/{$txId}</loc>\n";
        echo "    <lastmod>{$today}</lastmod>\n";
        echo "    <changefreq>never</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>' . "\n";
    exit();
}

// 5. Addresses Sitemap (Max 10.000)
if( preg_match( '/^sitemap-addresses(?:-(\d+))?\.xml$/', $target, $matches ) )
{
    $part = isset( $matches[1] ) ? (int)$matches[1] : 1;
    $offset = ( $part - 1 ) * $MAX_URLS;

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    $addrList = [];
    try {
        $RO = new RO( W8DB );
        if( $RO->isReady )
        {
            // Fetch top addresses from balances
            $stmt = $RO->db->db->query( "SELECT r1 FROM balances WHERE r2 = 0 ORDER BY r3 DESC LIMIT {$MAX_URLS} OFFSET {$offset}" );
            if( $stmt )
            {
                while( $row = $stmt->fetch() )
                {
                    $addressStr = $RO->getAddressById( (int)$row[0] );
                    if( $addressStr )
                        $addrList[] = $addressStr;
                }
            }
        }
    } catch( \Exception $e ) {}

    $today = date( 'Y-m-d' );
    foreach( array_unique( $addrList ) as $addr )
    {
        echo "  <url>\n";
        echo "    <loc>{$baseUrl}/{$addr}</loc>\n";
        echo "    <lastmod>{$today}</lastmod>\n";
        echo "    <changefreq>hourly</changefreq>\n";
        echo "    <priority>0.7</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>' . "\n";
    exit();
}

// Fallback to sitemap index
http_response_code( 404 );
echo '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap not found</error>';
exit();
