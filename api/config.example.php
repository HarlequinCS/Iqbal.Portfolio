<?php
/**
 * Copy this file to api/config.php on the server and fill in your values.
 * api/config.php is git-ignored and blocked from web access by api/.htaccess.
 *
 * Alternatively, leave this unused and set the environment variables
 * TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your web server config.
 */
return [
    'bot_token' => '',   // from @BotFather (use a NEW token: the old one was exposed)
    'chat_id'   => '',   // your Telegram chat ID
    // 'rate_limit'  => 5,    // messages per IP...
    // 'rate_window' => 600,  // ...per 10 minutes
];
