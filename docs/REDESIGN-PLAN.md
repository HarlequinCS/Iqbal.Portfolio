# Portfolio Redesign Plan

**Owner:** Muhammad Saiful Iqbal Abdul Rani · **Date:** November 2026 · **Status:** Implemented (v2)

This document records why the portfolio was redesigned, the design system it now uses, and how to maintain it.

---

## 1. Current design & UX assessment (v1)

| Area | Finding | Impact |
|---|---|---|
| **Security** | A Telegram bot token and chat ID were hard-coded in `js/telebot.js` and shipped to every visitor. | Anyone could read contact-form messages (names, emails) through the bot API or spam the chat. **The token must be revoked in @BotFather**: removing it from the code does not remove it from git history. |
| Visual identity | Template-derived dark theme: starfield, floating blurred blobs, particles, glowing buttons, mixed fonts (Montserrat, Roboto, Six Caps, Poppins), blue + green + red accents. | Reads as a generic template, not as a specific person. Nothing ties the look to security work. |
| Layout | A fixed sidebar takes 25% of the width on desktop; content scrolls behind a rotated vertical job title. | Wastes space, competes with content, and breaks on mid-size screens. |
| Projects | Shown in a horizontal carousel, three cards at a time. | Most projects are hidden behind arrows; carousels have low engagement and poor accessibility. No case-study depth outside two "Read more" toggles. |
| Headings | `txt-fx` split every heading into one `<span>` per letter. | Screen readers announce headings letter by letter; giant condensed display type was hard to read. |
| Loading | A full-screen preloader waited for *every* image and script before showing anything; scripts were loaded twice (once by `<script defer>`, again by the loader). | Slow first paint, duplicate work, content invisible without JavaScript. |
| Weight | Bootstrap CSS + JS, jQuery 1.11, Swiper/AOS/Isotope/Chocolat bundle, Font Awesome (CSS + webfonts), 4 Google font families. | ~400 KB+ of framework code for a one-page site. |
| Accessibility | Placeholder-only form fields, no skip link, no visible focus styles, low-contrast grey text on dark blue, motion everywhere with no reduced-motion handling, duplicate IDs. | Fails several WCAG 2.1 AA criteria. |
| SEO | No canonical URL, Open Graph, structured data, sitemap or robots file; empty web manifest name; `.htaccess` is ignored on GitHub Pages and referenced a missing `404.html`. | Weak search and link-preview presence. |
| Content | FAQ repeated content from other sections; "Digital Maestro"-style headings; claims without context. | Dilutes credibility. |

---

## 2. Visual direction & design system

### Concept: *"Evidence-backed"*

Iqbal's own engineering principle, from VERITAS, is **"AI proposes, evidence validates, rules decide."** The site is designed like a well-made technical assessment report: calm, precise, numbered, and every claim sits next to its proof. Instead of hacker clichés (green-on-black terminals, matrix rain, neon glow, padlocks, hoodies), the security identity comes from **structure and rigour**: indexed sections, record tables, monospaced metadata, clear status labels, and restraint.

### Colour

A warm paper-and-ink palette with one signal colour. Signal vermilion is the colour of audit marks and red-pen review, not of neon. Each colour has one job.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F3F1EC` | `#111315` | Page background |
| `--paper-2` | `#EBE8E1` | `#181B1E` | Panels, record tables |
| `--ink` | `#16181B` | `#ECE9E3` | Headings, primary text |
| `--ink-2` | `#3E424A` | `#C3C0BA` | Body text |
| `--muted` | `#696D74` | `#8E9299` | Metadata, captions |
| `--rule` | `#D7D3CA` | `#2A2E33` | Hairlines and borders |
| `--accent` | `#B93C12` | `#F0794A` | Links, marks, one highlight per view |
| `--ok` | `#2C6A43` | `#76C495` | "Live" status |
| `--warn` | `#7F5600` | `#E2B457` | "Demo on request" status |

All text pairs meet WCAG AA (4.5:1) in both themes. The theme follows the operating system and can be switched manually.

### Typography

**IBM Plex Sans** for text and headings and **IBM Plex Mono** for metadata, IDs and labels. Plex was designed for engineering documentation: credible, neutral, and less overused than Inter. Two families, five weights in total.

| Role | Size | Weight / tracking |
|---|---|---|
| Display (hero) | `clamp(2.4rem, 5.2vw, 4.4rem)` | 500 / -0.03em |
| H2 (section) | `clamp(1.75rem, 3vw, 2.5rem)` | 500 / -0.02em |
| H3 | 1.25–1.5rem | 600 / -0.01em |
| Body | 1rem → 1.0625rem | 400, line-height 1.65 |
| Meta (mono) | 0.75–0.8125rem | 500, uppercase, +0.06em |

### Space, grid and shape

- 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Content max width 1180px; 24px gutters (16px on phones).
- Section layout: a narrow index column (section number and name) beside the content column, like a report.
- Square-ish corners (2–4px), 1px hairlines, no drop shadows, no gradients.

### Components

`section-head` · `btn` (solid / outline / text) · `tag` · `status` (Live / Client work / Private / Demo on request) · `record` (key–value table) · `case-row` (featured work) · `project-row` (expandable index entry using `<details>`) · `timeline` · `cred-table` · `filter-bar` · `site-header` · `site-footer`.

### Signature details

1. **Section index numbers** (`01 Selected work`) in mono, and **record IDs** on projects (`CS-01`, `P-07`).
2. **The hero "record"**: a key–value summary of who Iqbal is, styled like the summary block of an assessment report.
3. **The marker underline**: one accent underline per view, used on the phrase *secure by design*.
4. **Proof next to claims**: every headline number links to the project that backs it.

---

## 3. Structure & navigation

**Before:** Sidebar · Hero · Capabilities · About · Experience · Portfolio carousel · Publishment carousel · Contact + FAQ.

**After:** a sticky top bar (Work · Experience · Capabilities · Credentials · About · Contact · Résumé · theme toggle) with active-section highlighting, a skip link, and a mobile menu.

```
index.html
├── Hero: positioning, record, proof strip
├── 01 Selected work: 4 featured case studies + filterable project index (11)
├── 02 Experience: ChendAwan Ventures, JPNJ internship
├── 03 Capabilities: skills with the evidence for each
├── 04 Credentials: certifications, awards, CTFs
├── 05 About: story, principles, education, leadership, publications, photos
└── 06 Contact: roles sought, email, form
work/
├── veritas.html     CS-01 case study
├── hrsb-one.html    CS-02 case study
└── roadsense.html   CS-03 case study
404.html · sitemap.xml · robots.txt
```

**User journey:** the first screen answers *who, what, proof*. Recruiters can reach the résumé in one click from any page. Hiring managers go to Selected work and then into a case study. Peers can filter the project index by Security.

---

## 4. Section-by-section recommendations

| Section | Redesign |
|---|---|
| **Hero** | Own tagline as the headline, not a name in giant type. One-sentence positioning, two actions (View work, Résumé), a portrait, and a record block with an availability status. A proof strip of four verifiable facts sits below. |
| **Selected work** | Four featured rows (VERITAS, HRSB ONE, JohorSTEMHub, RoadSense) with ID, status, role, summary, stack and a case-study or live link. Below them, a project index of the remaining 11 as expandable rows. Filters and status labels are kept. |
| **Case studies** | Dedicated pages: context record, problem, approach, implementation, challenges & decisions, outcome, stack, and previous/next navigation. Only facts from the profile; no invented metrics. |
| **Experience** | Date column + role column, with responsibilities as concise bullets. |
| **Capabilities** | Replaces chip clouds with *capability → where it was used*, so every skill has evidence. |
| **Credentials** | Certifications as a dated table; awards and CTFs as compact lists. |
| **About** | First-person story, five working principles, education, leadership, languages, publications (with English summaries), and three real photos with captions. |
| **Contact** | Roles sought, a large email link with copy-to-clipboard, social links, and an accessible form. FAQ removed (it duplicated other sections). |

---

## 5. Content & personal branding

- **Voice:** first person, plain, specific. Claims are stated with the evidence that supports them. No "passionate", "ninja", "guru" or "Digital Maestro".
- **Positioning line:** *Software engineer and cybersecurity developer. I build software that is useful, reliable and secure by design.*
- **Identity pillars:** Builder (client systems in production) · Security (VERITAS, CTFs, certifications) · Founder (Team ChendAwan Ventures) · Student (UiTM, CGPA 3.74).
- **Honesty rules:** team projects say "team of N" and don't claim the lead role unless stated; numbers come only from the profile; client work is marked private where code and screens can't be shared.
- **Ambition:** stated in Contact: the roles sought and the kind of team.

---

## 6. Animation & interaction strategy

Motion is used only for feedback, never for decoration.

- **Kept:** hover and focus states (colour, underline, 1–2px arrow nudge), details open/close, theme switch, smooth anchor scrolling.
- **Removed:** preloader, scroll-triggered fades, letter animations, floating shapes, particles, star layer, glow, carousels.
- `prefers-reduced-motion: reduce` turns off smooth scrolling and transitions.

---

## 7. Responsive design

- Mobile-first CSS with three breakpoints: 640px, 900px and 1180px.
- Header collapses into a menu button under 900px; the filter bar scrolls horizontally on small screens instead of wrapping into a wall of buttons.
- Index column stacks above content under 900px; record tables switch to stacked key/value pairs under 640px.
- Touch targets ≥ 44px; no horizontal page scroll at 320px.

---

## 8. Technical implementation & performance

| Change | Detail |
|---|---|
| **Framework removal** | No Bootstrap, jQuery, Swiper, AOS, Isotope, Chocolat or Font Awesome. One stylesheet (`css/main.css`) and one script (`js/main.js`, no dependencies). Icons are inline SVG. |
| **Fonts** | IBM Plex Sans + Mono from Google Fonts with `preconnect` and `display=swap`. |
| **Images** | Explicit `width`/`height` (no layout shift), `loading="lazy"` below the fold, publication covers converted from 540 KB PNGs to small WebP files. |
| **No-JS** | Every section renders without JavaScript; JS only adds the theme toggle, mobile menu, active nav, filters, copy-email and the form. |
| **Contact form** | No secrets in the browser. The form posts to `api/contact.php` on the server, which validates the message, rate-limits by IP, and forwards it to Telegram using a bot token stored only on the server. If the endpoint is unavailable, the visitor's email app opens with the message pre-filled. See `docs/DEPLOY.md`. |
| **SEO** | Canonical URLs, Open Graph/Twitter cards with a 1200×630 image, `Person` JSON-LD, per-page titles and descriptions, `sitemap.xml`, `robots.txt`, a real `404.html`, filled web manifest. |
| **Accessibility** | Semantic landmarks, one `h1` per page, skip link, visible focus rings, labelled form fields, `aria-pressed` filters, `aria-current` nav, AA contrast, reduced-motion support. |

### Maintenance

- **Add a project:** copy a `project-row` in `index.html`, set `data-category` (`client security mobile web iot`) and its status tag. Filter counts update automatically.
- **Mark a project live:** change its tag to `status--live` and add the link.
- **Change colours:** edit the tokens at the top of `css/main.css` (both themes).
