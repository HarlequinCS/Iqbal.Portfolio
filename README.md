# Muhammad Saiful Iqbal — Portfolio

Personal portfolio of **Muhammad Saiful Iqbal Abdul Rani**, Software Engineer & Cybersecurity Developer.

🌐 **Live:** [saifuliqbal.io](https://saifuliqbal.io/)

---

## Structure

```
index.html          Homepage: hero, work, experience, capabilities, credentials, about, contact
work/               Case studies (VERITAS, HRSB ONE, RoadSense)
css/main.css        Design system and layout (tokens at the top, light + dark themes)
css/fx.css          Experience layer: motion, depth, page transitions
js/main.js          Entry module: theme, menu, filters, contact form; loads the effects below
js/fx/              terrain.js (WebGL hero), motion.js (scroll), text.js, pointer.js
asset/              Résumé and CV (PDF)
images/             Portrait, photos, publication covers, icons, Open Graph image
api/                Contact form endpoint (forwards to Telegram; secrets stay on the server)
docs/               Redesign plan, design system notes, deployment guide (DEPLOY.md)
404.html            "Not found" page
```

No frameworks, no libraries, no build step: plain HTML, CSS and JavaScript (including the hand-written WebGL hero), plus one small PHP endpoint. The design rationale and maintenance notes are in [`docs/REDESIGN-PLAN.md`](docs/REDESIGN-PLAN.md).

## Common edits

- **Add a project:** copy a `<li data-category="…">` row in the *Project index* of `index.html`. Categories: `client`, `security`, `web`, `mobile`, `iot`. Filter counts update automatically.
- **Mark a project live:** change its status to `<span class="status status--live">Live</span>` and add the link.
- **Contact form:** posts to `api/contact.php`, which forwards the message to Telegram. The bot token lives only on the server (`api/config.php` or environment variables). If the endpoint isn't available, the form opens the visitor's email app instead. Never put private API tokens in front-end code.
- **Deploying to a server:** see [`docs/DEPLOY.md`](docs/DEPLOY.md).

## License

Proprietary. All rights reserved © 2026 **Muhammad Saiful Iqbal Abdul Rani**.
Please do not copy or reuse this portfolio's design or content without permission.
Contact: **iqbal.intern@gmail.com**
