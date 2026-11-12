#!/usr/bin/env python3
"""Live SEO audit for saifuliqbal.io. Standard library only.

    python3 tools/audit.py [https://saifuliqbal.io]

Fetches robots.txt and sitemap.xml, then every sitemap URL, and checks:
status codes, redirects, canonical/og:url agreement, title and description length and
uniqueness, exactly one <h1> and no skipped heading levels, lang attribute, JSON-LD
syntax and @id references, image alt/width/height, internal links (status, no
redirect hops), noindex leaks, X-Robots-Tag on PDFs, and the expected redirects
(http, www, *.html, /index.html). Prints PASS/WARN/FAIL lines; exits 1 on any FAIL.
"""
import json, re, sys, urllib.error, urllib.parse, urllib.request
from html.parser import HTMLParser
from xml.etree import ElementTree

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://saifuliqbal.io").rstrip("/")
HOST = urllib.parse.urlparse(BASE).netloc
UA = "Mozilla/5.0 (compatible; site-audit/1.0)"
fails = warns = 0


def out(level, msg):
    global fails, warns
    fails += level == "FAIL"; warns += level == "WARN"
    print(f"{level:4} {msg}")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None


opener = urllib.request.build_opener(NoRedirect)


def fetch(url, method="GET"):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
    try:
        r = opener.open(req, timeout=20)
        return r.status, r.headers, r.read() if method == "GET" else b""
    except urllib.error.HTTPError as e:  # also raised for 3xx, since redirects are not followed
        return e.code, e.headers, e.read() if method == "GET" else b""


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.headings, self.imgs, self.anchors, self.ld = {}, {}, [], [], [], []
        self.lang = None; self.title = ""; self._in = None; self._buf = []

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == "html": self.lang = a.get("lang")
        elif tag == "meta":
            k = a.get("name") or a.get("property")
            if k: self.meta[k] = a.get("content", "")
        elif tag == "link" and a.get("rel"): self.links.setdefault(a["rel"], a.get("href"))
        elif tag == "img": self.imgs.append(a)
        elif tag == "a" and a.get("href"): self.anchors.append(a["href"])
        elif tag == "title": self._in = "title"
        elif tag == "script" and a.get("type") == "application/ld+json": self._in = "ld"; self._buf = []
        if re.fullmatch(r"h[1-6]", tag): self.headings.append(int(tag[1]))

    def handle_endtag(self, tag):
        if tag == "script" and self._in == "ld": self.ld.append("".join(self._buf))
        if tag in ("title", "script"): self._in = None

    def handle_data(self, d):
        if self._in == "title": self.title += d
        elif self._in == "ld": self._buf.append(d)


# robots.txt -------------------------------------------------------------------------
st, h, body = fetch(BASE + "/robots.txt")
robots = body.decode(errors="replace")
out("PASS" if st == 200 else "FAIL", f"robots.txt {st}")
if not re.search(rf"^Sitemap:\s*{re.escape(BASE)}/sitemap\.xml\s*$", robots, re.M | re.I):
    out("FAIL", "robots.txt does not reference the sitemap")
if re.search(r"^Disallow:\s*/\s*$", robots, re.M):
    out("FAIL", "robots.txt disallows the whole site")

# sitemap -----------------------------------------------------------------------------
st, h, body = fetch(BASE + "/sitemap.xml")
out("PASS" if st == 200 else "FAIL", f"sitemap.xml {st} ({h.get('Content-Type', '?')})")
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [e.text.strip() for e in ElementTree.fromstring(body).findall("s:url/s:loc", ns)]
out("PASS" if urls else "FAIL", f"sitemap parses: {len(urls)} URLs")

titles, descs, internal = {}, {}, set()
for url in urls:
    st, h, body = fetch(url)
    if st != 200:
        out("FAIL", f"{url} -> {st}"); continue
    if "noindex" in h.get("X-Robots-Tag", "").lower():
        out("FAIL", f"{url} sends X-Robots-Tag noindex")
    p = Page(); p.feed(body.decode("utf-8", "replace"))
    tag = url[len(BASE):] or "/"
    issues = []
    if p.links.get("canonical") != url: issues.append(f"canonical {p.links.get('canonical')}")
    if p.meta.get("og:url") != url: issues.append(f"og:url {p.meta.get('og:url')}")
    if "noindex" in p.meta.get("robots", ""): issues.append("meta robots noindex")
    if not p.lang: issues.append("no <html lang>")
    t, d = p.title.strip(), p.meta.get("description", "")
    if not 30 <= len(t) <= 65: out("WARN", f"{tag}: title length {len(t)}")
    if not 70 <= len(d) <= 170: out("WARN", f"{tag}: description length {len(d)}")
    titles.setdefault(t, []).append(tag); descs.setdefault(d, []).append(tag)
    if p.headings.count(1) != 1: issues.append(f"{p.headings.count(1)} <h1>")
    for a, b in zip(p.headings, p.headings[1:]):
        if b > a + 1: issues.append(f"heading jump h{a}->h{b}"); break
    for k in ("og:title", "og:description", "og:image", "twitter:card"):
        if not p.meta.get(k): issues.append(f"missing {k}")
    for img in p.imgs:
        if "alt" not in img: issues.append(f"img without alt: {img.get('src')}")
        if not (img.get("width") and img.get("height")): issues.append(f"img without size: {img.get('src')}")
    types, ids, refs = [], set(), set()
    for block in p.ld:
        try:
            data = json.loads(block)
        except ValueError as e:
            issues.append(f"JSON-LD syntax: {e}"); continue
        def walk(o):
            if isinstance(o, dict):
                if "@type" in o and len(o) > 1:
                    types.extend(o["@type"] if isinstance(o["@type"], list) else [o["@type"]])
                    if "@id" in o: ids.add(o["@id"])
                elif set(o) == {"@id"}: refs.add(o["@id"])
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(data)
    if not types: issues.append("no JSON-LD")
    dangling = refs - ids
    if dangling: issues.append(f"JSON-LD @id references not defined on page: {sorted(dangling)}")
    out("FAIL" if issues else "PASS", f"{tag}: " + ("; ".join(issues) if issues else
        f"title/description/canonical/OG ok, h1 ok, JSON-LD: {', '.join(sorted(set(types)))}"))
    for href in p.anchors:
        full = urllib.parse.urljoin(url, href).split("#")[0]
        if urllib.parse.urlparse(full).netloc == HOST: internal.add(full)

for label, d in (("title", titles), ("description", descs)):
    for k, v in d.items():
        if len(v) > 1: out("FAIL", f"duplicate {label} on {v}")

# internal links ------------------------------------------------------------------------
for link in sorted(internal):
    if "/cdn-cgi/" in link:  # injected by Cloudflare (e.g. email obfuscation), not part of the site
        out("WARN", f"Cloudflare-injected link in pages: {link} (turn off Email Obfuscation to remove)"); continue
    st, h, _ = fetch(link, "HEAD" if link.endswith(".pdf") else "GET")
    if st in (301, 302, 307, 308):
        out("FAIL", f"internal link redirects: {link} -> {h.get('Location')}")
    elif st != 200:
        out("FAIL", f"broken internal link: {link} -> {st}")
    elif link.endswith(".pdf") and "noindex" not in h.get("X-Robots-Tag", "").lower():
        out("WARN", f"PDF is indexable: {link} (if the origin sends X-Robots-Tag, Cloudflare's cache is stale)")
out("PASS", f"{len(internal)} internal link targets checked")

# expected redirects and status codes ------------------------------------------------------
def expect(url, code, location=None):
    st, h, _ = fetch(url)
    loc = h.get("Location")
    ok = st == code and (location is None or loc == location)
    out("PASS" if ok else "FAIL", f"{url} -> {st} {loc or ''}".rstrip())

expect(f"http://{HOST}/", 301, BASE + "/")
expect(f"https://www.{HOST}/", 301, BASE + "/")
expect(BASE + "/index.html", 301, BASE + "/")
expect(BASE + "/work/veritas.html", 301, BASE + "/work/veritas")
expect(BASE + "/this-page-does-not-exist", 404)
expect(BASE + "/404", 404)
expect(BASE + "/api/", 404)
expect(BASE + "/README.md", 404)
expect(BASE + "/.git/config", 404)

print(f"\n{fails} FAIL, {warns} WARN")
sys.exit(1 if fails else 0)
