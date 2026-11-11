# Personal brand SEO: ranking for "Saiful Iqbal"

Goal: when someone searches **Saiful Iqbal**, saifuliqbal.io should be the first organic result where possible. **No one can guarantee this.** Google decides rankings, and "Saiful Iqbal" is a fairly common name, so other people with the same name compete for it. What this plan can do is make your site the clearest, most consistent and best-connected source about *you*. That's what Google rewards for a name search.

## Already done on the site

| Signal | Implementation |
|---|---|
| Exact-match domain | `saifuliqbal.io` already matches the query, a strong start |
| Name in the key places | Every `<title>` includes "Saiful Iqbal"; the homepage title starts with it; the homepage `<h1>` opens with "Saiful Iqbal."; descriptions and the lead name all three forms once |
| One entity, many name forms | `Person` schema: `name` = Muhammad Saiful Iqbal Abdul Rani; `alternateName` = Saiful Iqbal, Muhammad Saiful Iqbal, Iqbal; visible text on `/about` says the same ("usually Saiful Iqbal, or just Iqbal") |
| Profile page markup | Homepage = `ProfilePage`; `/about` = `AboutPage` + `ProfilePage`, both with `mainEntity` → the same `#person` ID |
| Identity links | `sameAs` → LinkedIn and GitHub; visible profile links use `rel="me"` |
| Credibility in markup | Education (UiTM, linked to Wikipedia), 10 certifications, 3 awards, employer (Team ChendAwan Ventures, with `founder` → you), occupations, languages, location |
| A page that answers "who is Saiful Iqbal" | `/about`, with a FAQ that answers exactly that, in your own words |
| Image search | Portrait renamed `saiful-iqbal.webp`, with descriptive alt text, listed in the image sitemap |
| Case studies credited to you | `Article.author` → you, plus visible bylines |

## What decides the rest (in order of impact)

### 1. Make every profile say the same thing and link back (highest impact, free)
Google confirms who you are by comparing sources. Use **exactly** the same name, headline and photo everywhere, and link each profile to `https://saifuliqbal.io`:
- **LinkedIn** (`linkedin.com/in/saiful-iqbal12`): name "Muhammad Saiful Iqbal Abdul Rani" or "Saiful Iqbal" (match the site); headline "Software Engineer & Cybersecurity Developer"; add the site under *Contact info → Website* and in *Featured*.
- **GitHub** (`HarlequinCS`): set *Name* to "Saiful Iqbal", *Website* to `https://saifuliqbal.io`, location "Johor, Malaysia", and add a profile README (`HarlequinCS/HarlequinCS`) that links to the site. Your username doesn't contain your name, so these fields matter even more.
- **VERITAS** (`scanwithveritas.tech`): add "Built by Saiful Iqbal" in the footer or About page, linking to `https://saifuliqbal.io/`. This is a strong, relevant link from a site you control.
- **Credential pages** (Red Team Leaders, Cisco/Credly, OPSWAT): use the same name. If they offer public verification URLs, send them to me and I'll link them from the site.

**Any new profile you create, tell me and I'll add it to `sameAs`.** Only add profiles that are really yours and that link back.

### 2. Get mentioned on other sites (high impact, needs other people)
These are links Google trusts, and they can't be faked:
- UiTM faculty or club news about the TAMiNG iCTF8 placing, the Ideathon win or VERITAS (ask the organiser or faculty to name and link you).
- Competition organisers' results pages (TAMiNG, OWASP KL, IHack).
- Clients: a "developed by Team ChendAwan Ventures / Saiful Iqbal" credit in the footer of JohorSTEMHub.com or HRSB ONE's public pages, if the client agrees.
- JPNJ: ask whether the online copies of the two maths modules you edited can name you and link to the site.
- Write-ups on platforms that let you link to your site: CTF write-ups on Medium or dev.to, talks, a GitHub project README.

Never buy links, swap links in bulk, or use link networks. These break Google's spam policies and can get the site removed.

### 3. Keep adding real content on the site (medium impact, steady)
Every page that's genuinely about your work reinforces the entity. Candidates, in order:
1. **VERITAS deep dive with screenshots or a short demo video.** A video on YouTube titled "VERITAS demo by Saiful Iqbal", embedded on the case study, adds a second searchable property.
2. **CTF write-ups**, one page each (without spoiling live challenges), e.g. "TAMiNG iCTF8: how we placed 1st Runner-Up".
3. **Veritas Payloads case study**: a draft branch (`story/veritas-payloads`) already exists in this repo.
4. **Certifications page** with verification links.

Each new page: unique title containing "Saiful Iqbal" where natural, a canonical, JSON-LD with `author` → `#person`, and a link from an existing page. Then run `tools/deploy.sh`, and the sitemap updates itself.

### 4. Search Console (needed to measure anything)
Verify the domain and submit the sitemap (steps in `docs/SEO-REPORT.md`, section 6). After 2–4 weeks, **Performance → Queries** will show your real position for "saiful iqbal" and variants. Without this, any claim about rankings is a guess.

### 5. Knowledge Panel (longer term)
Google may show a Knowledge Panel for a person once enough consistent, independent sources agree. You can't create one directly. If one appears, claim it via "Claim this knowledge panel" (sign in with Google, verified through Search Console or an official profile). The structured data on the site is already set up to feed it.

## What to expect
- **Indexing:** usually days after you request it in Search Console.
- **Name ranking:** often weeks to a few months. For a less contested name variant ("Muhammad Saiful Iqbal Abdul Rani", "Saiful Iqbal VERITAS", "Saiful Iqbal UiTM"), the site will likely rank first sooner than for "Saiful Iqbal" on its own.
- **Results vary by country and by person.** Check from Malaysia in a private window, or rely on Search Console data instead of your own searches.
- **Who you're competing with:** other people named Saiful Iqbal with LinkedIn pages, news mentions or older sites. Steps 1 and 2 above are what close that gap. Changes to the site alone have done most of what they can.
