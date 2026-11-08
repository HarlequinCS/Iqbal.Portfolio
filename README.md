# Muhammad Saiful Iqbal — Portfolio

Personal portfolio of **Muhammad Saiful Iqbal Abdul Rani**, Software Engineer & Cybersecurity Developer.

🌐 **Live:** [harlequincs.github.io/Iqbal.Portfolio](https://harlequincs.github.io/Iqbal.Portfolio/)

---

## Structure

```
index.html          Homepage: hero, work, experience, capabilities, credentials, about, contact
work/               Case studies (VERITAS, HRSB ONE, RoadSense)
css/main.css        The whole design system (tokens at the top, light + dark themes)
js/main.js          Theme toggle, mobile menu, active nav, project filters, copy email, contact form
asset/              Résumé and CV (PDF)
images/             Portrait, photos, publication covers, icons, Open Graph image
docs/               Redesign plan and design system notes
404.html            GitHub Pages "not found" page
```

No frameworks, no build step: plain HTML, CSS and JavaScript. The design rationale and maintenance notes are in [`docs/REDESIGN-PLAN.md`](docs/REDESIGN-PLAN.md).

## Common edits

- **Add a project:** copy a `<li data-category="…">` row in the *Project index* of `index.html`. Categories: `client`, `security`, `web`, `mobile`, `iot`. Filter counts update automatically.
- **Mark a project live:** change its status to `<span class="status status--live">Live</span>` and add the link.
- **Contact form:** by default it opens the visitor's email app. To receive messages directly, create a form on a form service such as Formspree and put its endpoint URL in `data-endpoint` on `<form id="contact-form">`. Never put private API tokens in front-end code.

## License

Proprietary. All rights reserved © 2026 **Muhammad Saiful Iqbal Abdul Rani**.
Please do not copy or reuse this portfolio's design or content without permission.
Contact: **iqbal.intern@gmail.com**
