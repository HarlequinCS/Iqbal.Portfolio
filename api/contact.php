<?php
/**
 * Contact endpoint: receives the portfolio contact form and forwards it to Telegram.
 *
 * The Telegram bot token stays on the server. It is read from, in order:
 *   1. Environment variables TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 *      (e.g. SetEnv in the Apache virtual host, or fastcgi_param in Nginx)
 *   2. api/config.php (copy api/config.example.php; git-ignored and blocked from the web)
 *
 * Requires PHP 7.4+ with the curl extension (or allow_url_fopen enabled).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

// ---------- Configuration ----------
$config = [
    'bot_token'      => getenv('TELEGRAM_BOT_TOKEN') ?: '',
    'chat_id'        => getenv('TELEGRAM_CHAT_ID') ?: '',
    'rate_limit'     => 5,     // messages allowed per IP...
    'rate_window'    => 600,   // ...per this many seconds
    'api_base'       => getenv('TELEGRAM_API_BASE') ?: 'https://api.telegram.org', // override only for testing
];
$file = __DIR__ . '/config.php';
if (is_file($file)) {
    $local = require $file;
    if (is_array($local)) {
        foreach ($local as $k => $v) {
            if ($v !== '' && $v !== null) $config[$k] = $v;
        }
    }
}

// ---------- Request checks ----------
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

// Same-origin only: a browser on another website can't post here.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && strcasecmp((string) parse_url($origin, PHP_URL_HOST) . (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : ''), $host) !== 0) {
    reply(403, ['ok' => false, 'error' => 'origin_not_allowed']);
}

if ($config['bot_token'] === '' || $config['chat_id'] === '') {
    reply(500, ['ok' => false, 'error' => 'not_configured']);
}

$raw = file_get_contents('php://input', false, null, 0, 8001);
if ($raw === false || strlen($raw) > 8000) {
    reply(413, ['ok' => false, 'error' => 'too_large']);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    reply(400, ['ok' => false, 'error' => 'invalid_json']);
}

// Honeypot: people never fill this hidden field. Pretend success to bots.
if (isset($data['website']) && is_string($data['website']) && trim($data['website']) !== '') {
    reply(200, ['ok' => true]);
}

$clean = static function ($v, int $max): string {
    if (!is_string($v)) return '';
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '');
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
};
$name = $clean($data['name'] ?? '', 100);
$email = $clean($data['email'] ?? '', 200);
$message = $clean($data['message'] ?? '', 2000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(422, ['ok' => false, 'error' => 'invalid_fields']);
}

// ---------- Rate limit (per IP, stored in the system temp dir) ----------
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = sys_get_temp_dir() . '/portfolio-contact-' . hash('sha256', $ip) . '.json';
$now = time();
$hits = [];
if (is_file($bucket)) {
    $hits = json_decode((string) @file_get_contents($bucket), true) ?: [];
}
$hits = array_values(array_filter($hits, static function ($t) use ($now, $config) {
    return is_int($t) && $t > $now - (int) $config['rate_window'];
}));
if (count($hits) >= (int) $config['rate_limit']) {
    reply(429, ['ok' => false, 'error' => 'too_many_requests']);
}
$hits[] = $now;
@file_put_contents($bucket, json_encode($hits), LOCK_EX);

// ---------- Send to Telegram ----------
// Plain text (no parse_mode) so visitor input can't inject formatting or links.
$text = "New portfolio message\n\nName: {$name}\nEmail: {$email}\n\n{$message}";
$url = rtrim((string) $config['api_base'], '/') . '/bot' . $config['bot_token'] . '/sendMessage';
$payload = json_encode([
    'chat_id' => $config['chat_id'],
    'text' => $text,
    'disable_web_page_preview' => true,
]);

$status = 0;
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
    ]);
    $ok = curl_exec($ch);
    $status = $ok === false ? 0 : (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
} else {
    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $payload,
        'timeout' => 10,
        'ignore_errors' => true,
    ]]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res !== false && isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $status = (int) $m[1];
    }
}

if ($status !== 200) {
    // Never echo the URL: it contains the token.
    error_log('portfolio contact: Telegram send failed with HTTP status ' . $status);
    reply(502, ['ok' => false, 'error' => 'send_failed']);
}

reply(200, ['ok' => true]);
