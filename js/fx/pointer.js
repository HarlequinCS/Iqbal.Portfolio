/**
 * Pointer-driven effects for devices with a precise pointer (mouse/trackpad):
 * a cursor follower, magnetic buttons, tilting cards with a moving spotlight,
 * and the light that follows the pointer in the contact section.
 *
 * Touch devices never load any of this behaviour.
 */

const lerp = (a, b, t) => a + (b - a) * t;

/** A ring that trails the native cursor and reacts to what it is over. */
function initCursor() {
  const ring = document.createElement("div");
  ring.className = "cursor";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);

  const pos = { x: -100, y: -100, tx: -100, ty: -100 };
  let raf = 0;

  const tick = () => {
    pos.x = lerp(pos.x, pos.tx, 0.2);
    pos.y = lerp(pos.y, pos.ty, 0.2);
    ring.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    // Stop the loop once the ring has caught up; it restarts on the next move.
    raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.2 ? requestAnimationFrame(tick) : 0;
  };

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    pos.tx = e.clientX;
    pos.ty = e.clientY;
    if (!ring.classList.contains("is-on")) { pos.x = pos.tx; pos.y = pos.ty; ring.classList.add("is-on"); }
    if (!raf) raf = requestAnimationFrame(tick);

    const t = e.target instanceof Element ? e.target : null;
    const labelled = t && t.closest("[data-cursor]");
    const interactive = t && t.closest("a, button, summary, label, [role='button']");
    const typing = t && t.closest("input, textarea, select");
    ring.classList.toggle("is-label", !!labelled);
    ring.classList.toggle("is-hover", !!interactive && !labelled);
    ring.classList.toggle("is-text", !!typing);
    ring.textContent = labelled ? labelled.getAttribute("data-cursor") : "";
  }, { passive: true });

  window.addEventListener("pointerdown", () => ring.classList.add("is-down"));
  window.addEventListener("pointerup", () => ring.classList.remove("is-down"));
  document.documentElement.addEventListener("pointerleave", () => ring.classList.remove("is-on"));
}

/** Buttons lean toward the pointer and spring back when it leaves. */
function initMagnetic(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    const strength = el.classList.contains("icon-btn") ? 0.4 : 0.22;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transition = "transform .15s linear, background-color .15s ease, color .15s ease, border-color .15s ease";
      el.style.transform = `translate3d(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px, 0)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .7s cubic-bezier(.2, 1.6, .4, 1), background-color .15s ease, color .15s ease, border-color .15s ease";
      el.style.transform = "";
    });
  });
}

/** Cards tilt in 3D toward the pointer; a spotlight follows it across the surface. */
function initTilt(selector, max = 5) {
  document.querySelectorAll(selector).forEach((card) => {
    const surface = card.querySelector(".case-tilt") || card;
    let raf = 0, event = null;

    const apply = () => {
      raf = 0;
      const r = surface.getBoundingClientRect();
      const px = (event.clientX - r.left) / r.width;
      const py = (event.clientY - r.top) / r.height;
      surface.style.setProperty("--ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg");
      surface.style.setProperty("--rx", ((0.5 - py) * 2 * max).toFixed(2) + "deg");
      surface.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      surface.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    };

    card.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      event = e;
      surface.classList.add("is-tilting");
      if (!raf) raf = requestAnimationFrame(apply);
    });
    card.addEventListener("pointerleave", () => {
      surface.classList.remove("is-tilting");
      surface.style.setProperty("--rx", "0deg");
      surface.style.setProperty("--ry", "0deg");
    });
  });
}

/** A soft light that drifts after the pointer inside a section. */
function initGlow(sectionSelector, glowSelector) {
  const section = document.querySelector(sectionSelector);
  const glow = section && section.querySelector(glowSelector);
  if (!glow) return;
  section.addEventListener("pointermove", (e) => {
    const r = section.getBoundingClientRect();
    glow.style.setProperty("--gx", (e.clientX - r.left) + "px");
    glow.style.setProperty("--gy", (e.clientY - r.top) + "px");
  }, { passive: true });
}

export function initPointer() {
  initCursor();
  initMagnetic(".hero-actions .btn, .header-actions .btn, .icon-btn, .form .btn, .not-found .btn");
  initTilt(".case-card");
  initGlow("#contact", ".glow--contact");
}
