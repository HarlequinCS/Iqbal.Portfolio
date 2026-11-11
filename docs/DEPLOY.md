# Deploying to a private server

The site is plain HTML/CSS/JS plus one PHP file (`api/contact.php`) that forwards the contact form to Telegram. Everything is ready; you only need to copy the files and add your Telegram secrets on the server.

## Requirements

| Need | Why |
|---|---|
| Apache 2.4 with `mod_rewrite` and `mod_headers` (`AllowOverride All` for the site) | `.htaccess`: HTTPS redirect, security headers, CSP, caching, hidden files |
| PHP 7.4+ with the `curl` extension (or `allow_url_fopen = On`) | `api/contact.php` |
| HTTPS certificate (e.g. Let's Encrypt / Certbot) | HTTPS is forced and HSTS is sent |
| Site served from the **domain root** (`https://saifuliqbal.io/`) | The 404 page and `ErrorDocument` use root paths |

Using Nginx instead? See [Nginx](#nginx) at the end.

---

## 1. Get a new Telegram bot token

The old token was published in the old site's JavaScript and is still in git history.

1. In Telegram, open **@BotFather**, send `/revoke` and pick your bot. You'll get a **new token**.
2. Your **chat ID** is unchanged if the bot has messaged you before. Otherwise, send your bot a message, open `https://api.telegram.org/bot<NEW_TOKEN>/getUpdates`, and copy `"chat":{"id": …}`.

## 2. Copy the site to the server

```bash
# on the server, e.g. into /var/www/portfolio
git clone https://github.com/HarlequinCS/Iqbal.Portfolio.git /var/www/portfolio
```

(Or upload the files by SFTP. You don't need `docs/`, `README.md` or `wip.html`; the server already refuses to serve `README.md` and any dotfile, including `.git/`.)

## 3. Add the secrets (choose one)

**Option A: config file (simplest, works on shared hosting)**

```bash
cd /var/www/portfolio/api
cp config.example.php config.php
nano config.php            # fill in bot_token and chat_id
chmod 640 config.php
chown root:www-data config.php   # readable by the web server, not world-readable
```

`config.php` is git-ignored, so it's never committed, and `api/.htaccess` blocks web access to it. Even if that block failed, PHP would execute the file and print nothing.

**Option B: environment variables (keeps secrets out of the web folder)**

In the Apache virtual host, not in `.htaccess`:

```apache
SetEnv TELEGRAM_BOT_TOKEN "123456:ABC..."
SetEnv TELEGRAM_CHAT_ID   "123456789"
```

Then `sudo systemctl reload apache2`. With PHP-FPM, set them in the pool file instead: `env[TELEGRAM_BOT_TOKEN] = ...`.

## 4. Apache virtual host

```apache
<VirtualHost *:443>
    ServerName saifuliqbal.io
    ServerAlias www.saifuliqbal.io
    DocumentRoot /var/www/portfolio
    <Directory /var/www/portfolio>
        AllowOverride All
        Require all granted
    </Directory>
    # SSLEngine on + certificate lines (Certbot adds these)
</VirtualHost>
```

Enable the modules once: `sudo a2enmod rewrite headers deflate && sudo systemctl reload apache2`.

## 5. DNS and HTTPS for saifuliqbal.io

The site's canonical links, social previews, sitemap and `robots.txt` already use `https://saifuliqbal.io`, and `.htaccess` redirects `www.saifuliqbal.io` there.

1. At your domain registrar, point an **A record** for `saifuliqbal.io` (and `www`) to your server's IP address. Add an **AAAA record** too if the server has IPv6.
2. Get a certificate that covers both names:
   ```bash
   sudo certbot --apache -d saifuliqbal.io -d www.saifuliqbal.io
   ```
3. After launch, add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://saifuliqbal.io/sitemap.xml`.

> `.io` domains are often used with Cloudflare. If you put Cloudflare's proxy in front of the server, set SSL/TLS mode to **Full (strict)**. The HTTPS redirect already respects Cloudflare's `X-Forwarded-Proto` header, so it won't loop.

## 6. Check it works

1. Open the site: styles, fonts, dark/light toggle and project filters should all work.
2. Browser dev tools → Console: there should be **no** "Content Security Policy" errors.
3. Send a test message through the form: it should arrive in Telegram within seconds, and the page should say *"Thanks, … Your message has been sent"*.
4. Open `https://saifuliqbal.io/api/config.php` and `https://saifuliqbal.io/.git/config`: both must be blocked (403/404).
5. Optional: check the headers at [securityheaders.com](https://securityheaders.com).

If the form says *"I couldn't send that directly"*, the endpoint is missing the token or can't reach Telegram. The visitor's email app opens instead, so no message is lost. The server's PHP error log will contain `portfolio contact: Telegram send failed with HTTP status …`.

---

## Maintenance notes

- **Content Security Policy:** `.htaccess` allows the one inline script (the theme switcher in each page's `<head>`) by its SHA-256 hash. If you edit that script, recalculate the hash or the theme toggle stops working. Browsers hash it with LF line endings:
  ```bash
  php -r '$h=str_replace("\r\n","\n",file_get_contents("index.html")); preg_match("#<script>(.*?)</script>#s",$h,$m); echo "sha256-",base64_encode(hash("sha256",$m[1],true)),"\n";'
  ```
  The browser console also prints the expected hash when it blocks the script.
- **Rate limit:** 5 messages per visitor IP per 10 minutes. Change `rate_limit` / `rate_window` in `api/config.php`.
- **Caching:** CSS and JS are cached for one day, so changes reach returning visitors within 24 hours.

---

## Nginx

`.htaccess` is ignored by Nginx. Equivalent rules:

```nginx
server {
    listen 443 ssl http2;
    server_name saifuliqbal.io www.saifuliqbal.io;
    root /var/www/portfolio;
    index index.html;
    error_page 403 404 /404.html;

    location ~ /\.(?!well-known/) { return 404; }
    location ~ ^/(README\.md|LICENSE|wip\.css\.map)$ { return 404; }
    location ^~ /api/ {
        location = /api/contact.php {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param TELEGRAM_BOT_TOKEN "123456:ABC...";
            fastcgi_param TELEGRAM_CHAT_ID   "123456789";
            fastcgi_pass unix:/run/php/php-fpm.sock;
        }
        return 404;
    }

    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'sha256-+1hJWWJuUVnAvkspFViCtOeQxjkrCQv+nU0tX0Q5W3Y='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```
