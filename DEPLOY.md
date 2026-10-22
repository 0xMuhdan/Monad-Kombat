# Deploying MONAD KOMBAT

MONAD KOMBAT is a modern cyber fighting game with 60 FPS deterministic combat: HTML, CSS, JavaScript, WebP images, MP3 audio, one MP4 loop and TTF fonts (about 34 MB, listed in `files.json`). Any web server that serves static files can host it, and Colyseus WebSocket powers the realtime multiplayer.

The examples below install the client in a subfolder, `https://example.com/monad-kombat/`. For a domain root, drop the `/monad-kombat` prefix.

## 1. Requirements

- **HTTPS.** The loading screen caches files through a service worker, and browsers only enable service workers on HTTPS (or `localhost`). Without HTTPS the game still runs, just without the cache.
- **Trailing slash.** Every path in the game is relative, so the page must be opened as `/monad-kombat/`. Without the slash the browser looks for assets at the domain root and gets 404s. Redirect `/monad-kombat` to `/monad-kombat/` with a 301. nginx and Apache do this on their own for real folders; for an nginx `alias` add the redirect yourself (below).
- The service worker's scope is limited to its own folder (`/monad-kombat/`), so it never touches the rest of the site.

## 2. Copy the files

Upload the repository contents (everything except `.git`, `README.md`, `DEPLOY.md`, the license files, `docs/` and `guide/`) into the site's document root, in a folder called `monad-kombat`:

```bash
DOCROOT=/var/www/example.com           # your site's document root
sudo mkdir -p "$DOCROOT/monad-kombat"
sudo rsync -a --delete \
  --exclude .git --exclude README.md --exclude DEPLOY.md --exclude 'LICENSE*' --exclude docs --exclude guide \
  ./ "$DOCROOT/monad-kombat/"
```

Give the files to the web server's user (`www-data` on Debian/Ubuntu, `nginx` or `apache` on RHEL, or your panel's site user):

```bash
OWNER=$(stat -c '%U:%G' "$DOCROOT")
sudo chown -R "$OWNER" "$DOCROOT/monad-kombat"
sudo find "$DOCROOT/monad-kombat" -type d -exec chmod 755 {} \;
sudo find "$DOCROOT/monad-kombat" -type f -exec chmod 644 {} \;
```

If the main site runs WordPress or another CMS, that is fine: a real `monad-kombat/` folder is served directly as static files.

## 3. Configure the web server

Aim for:

1. `/monad-kombat` → 301 → `/monad-kombat/`
2. Correct MIME types: `.js` JavaScript, `.webp` `image/webp`, `.mp3` `audio/mpeg`, `.mp4` `video/mp4`, `.ttf` `font/ttf`
3. `Cache-Control: no-cache` for the game files. Browsers still reuse their copy after an ETag/Last-Modified check, and the game keeps hashed copies in Cache Storage, so updates show up at once. Avoid long `expires`/`max-age` rules for this path.
4. MP3/MP4 served with range requests (206), which is the default for static files, and not gzipped.

### nginx

Inside the site's HTTPS `server { … }` block:

```nginx
location = /monad-kombat { return 301 /monad-kombat/; }
location ^~ /monad-kombat/ {
    # If the files are NOT inside the document root, point to them (keep the trailing slash):
    # alias /var/www/monad-kombat/;
    try_files $uri $uri/ =404;
    add_header Cache-Control "no-cache" always;
    gzip on;
    gzip_types text/css application/javascript text/javascript application/json image/svg+xml;
}
```

`^~` keeps other rules (image caching, PHP) from taking over this path. Recent nginx versions already map `webp`, `mp3`, `mp4` and `js` in `/etc/nginx/mime.types`. If `font/ttf` is missing, add `font/ttf ttf;` to that file; don't use a `types { }` block inside the location, because it replaces every other MIME type. Then reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Apache / LiteSpeed

The included `.htaccess` sets the MIME types, `no-cache` and compression. It needs `AllowOverride` to allow at least `FileInfo` for the document root, plus `mod_mime`, `mod_headers` and `mod_deflate`:

```bash
sudo a2enmod headers mime deflate
sudo systemctl reload apache2
```

`mod_dir` adds the trailing-slash redirect for the folder automatically.

### Caddy

```caddy
redir /monad-kombat /monad-kombat/ 301
header /monad-kombat/* Cache-Control "no-cache"
```

### GitHub Pages, Netlify and similar hosts

Publish the repository as it is. These hosts already send correct MIME types and add the trailing-slash redirect for folders.

## 4. Check the deployment

```bash
BASE=https://example.com/monad-kombat
curl -sI "$BASE"            | grep -iE "^HTTP|^location"                  # 301 -> /monad-kombat/
curl -sI "$BASE/"           | grep -iE "^HTTP|content-type"               # 200 text/html
curl -sI "$BASE/sw.js"      | grep -iE "^HTTP|content-type|cache-control" # 200, javascript, no-cache
curl -sI "$BASE/assets/stage.webp" | grep -iE "^HTTP|content-type"        # 200 image/webp
curl -s -o /dev/null -w "%{http_code}\n" -H "Range: bytes=0-99" \
  "$BASE/assets/audio/music/midday-showdown.mp3"                          # 206
```

Check that every file in `files.json` is reachable:

```bash
python3 - <<'PY'
import json, urllib.request
base = "https://example.com/monad-kombat/"
files = json.load(urllib.request.urlopen(base + "files.json"))["list"]
bad = []
for f in files:
    try:
        with urllib.request.urlopen(urllib.request.Request(base + f["file"], method="HEAD")) as r:
            if r.status != 200: bad.append((f["file"], r.status))
    except Exception as e:
        bad.append((f["file"], str(e)))
print(len(files), "files checked,", len(bad), "problems")
for b in bad[:30]: print(b)
PY
```

Then open the game in a browser:

1. The first visit shows the loading screen ("Preparing the combat circuit...") until all assets are downloaded, then the main menu.
2. DevTools → Console shows no 404 or MIME errors, and Application → Service Workers lists `sw.js` with the scope `…/monad-kombat/`.
3. A reload is much faster (served from the cache).
4. On a phone, the page switches to `mobile.html` (landscape with touch controls).

## Updating

Upload the new files over the old ones (the `rsync --delete` above) and fix the ownership again. No cache purge is needed: HTML and JS use `no-cache`, and `precache.js` carries a hash for every file, so players only download what changed.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Blank page or every asset 404 | Opened without the trailing slash, or the files are in the wrong folder. Check the redirect and where `index.html` is |
| Loading stalls or the service worker fails | `sw.js` is not served as JavaScript, or is cached for too long. Check `curl -sI …/sw.js` |
| No audio/video on Safari or iPhone | Range requests are not supported. Serve MP3/MP4 directly as static files, without gzip or a proxy that drops the `Range` header |
| Changes don't appear | A long cache rule (a global `expires`, a cache plugin or a CDN). Exclude `/monad-kombat/` from it |
| HTTP 500 after upload (Apache/LiteSpeed) | `AllowOverride` does not allow the `.htaccess` directives. Allow `FileInfo`, or delete `.htaccess` and set MIME types and headers in the server config |
| Behind Cloudflare | Bypass the cache for `/monad-kombat/*` (or purge after each deploy) and turn Rocket Loader off for this path |
