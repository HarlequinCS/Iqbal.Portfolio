/**
 * Scroll-driven motion: reveals, headline splits, counters, progress bar,
 * auto-hiding header, parallax and the timeline spine.
 *
 * One IntersectionObserver decides what is on screen; one rAF-throttled
 * scroll handler updates everything that follows the scroll position.
 */
import { splitWords, countUp, scramble } from "./text.js";

/* Elements that fade/rise in as they enter the viewport. Chosen by selector so
   every page (home, case studies, 404) gets the behaviour without extra markup. */
const REVEAL = [
  ".section-head > :not(h2)", ".sub-head", ".filter-bar", ".case-card", ".project-list > li",
  ".timeline > li", ".evidence", ".stack-group", ".cred-table tbody tr", ".plain-list > li",
  ".about-story > p", ".photos figure", ".principles > li", ".pub", ".contact-email",
  ".link-list > li", ".form", ".prose > :not(.decisions)", ".decision", ".cs-aside", ".cs-pager",
].join(",");

const HEADLINES = ".section-head h2";              // split + reveal when scrolled into view
const HEADLINES_NOW = ".hero h1, .cs-hero h1, .not-found h1";   // split + reveal on load

export function initMotion() {
  const root = document.documentElement;
  const introDelay = root.classList.contains("intro") ? 1350 : 0;

  /* ---- Headlines ---- */
  document.querySelectorAll(HEADLINES_NOW).forEach((h) => {
    splitWords(h);
    // Shortly after, so the hidden state is painted before the transition starts.
    // A timer (not rAF) because rAF is paused in background tabs, which would
    // leave the headline hidden until the tab is focused.
    setTimeout(() => h.classList.add("is-in"), 40);
  });
  document.querySelectorAll(HEADLINES).forEach(splitWords);

  /* ---- Reveal on scroll ---- */
  const targets = document.querySelectorAll(REVEAL);
  targets.forEach((el) => el.classList.add("rv"));
  root.classList.add("reveal-ready");

  const seen = new IntersectionObserver((entries) => {
    let order = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      seen.unobserve(el);

      if (el.matches(".rv")) {
        // Elements arriving together cascade instead of popping in at once.
        const delay = Math.min(order++, 7) * 70;
        el.style.transitionDelay = delay + "ms";
        el.classList.add("is-in");
        setTimeout(() => { el.style.transitionDelay = ""; }, delay + 1100);
      } else {
        el.classList.add("is-in", "is-seen");
      }

      el.querySelectorAll("[data-count]").forEach((n) => setTimeout(() => countUp(n), introDelay));
      el.querySelectorAll("[data-scramble]").forEach((n) => scramble(n));
      if (el.matches("[data-scramble]")) scramble(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  targets.forEach((el) => seen.observe(el));
  document.querySelectorAll(`${HEADLINES}, .section, .wordmark, .proof, .section-index [data-scramble]`).forEach((el) => seen.observe(el));

  /* ---- Keep looping diagrams paused while off screen ---- */
  const live = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("is-visible", e.isIntersecting));
  });
  document.querySelectorAll(".case-card").forEach((el) => live.observe(el));

  /* ---- Scroll-linked pieces ---- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const parallax = Array.from(document.querySelectorAll("[data-parallax]"));
  const timelines = Array.from(document.querySelectorAll(".timeline"));
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);

    // Header steps aside while reading down, returns on the way up.
    if (header) {
      const menuOpen = nav && nav.getAttribute("data-open") === "true";
      const hide = y > 500 && y > lastY + 4 && !menuOpen && !header.contains(document.activeElement);
      if (hide) header.classList.add("is-hidden");
      else if (y < lastY - 4 || y <= 500) header.classList.remove("is-hidden");
    }
    lastY = y;

    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });

    timelines.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = (vh * 0.7 - r.top) / r.height;
      el.style.setProperty("--tp", Math.max(0, Math.min(1, p)).toFixed(3));
    });
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();

  /* ---- Marquee: duplicate the group so the loop is seamless ---- */
  document.querySelectorAll(".marquee-track").forEach((track) => {
    const group = track.firstElementChild;
    if (!group) return;
    const copy = group.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
  });

  /* ---- Once the intro has played, drop its class so nothing stays delayed ---- */
  if (introDelay) setTimeout(() => root.classList.remove("intro"), introDelay + 1600);
}
