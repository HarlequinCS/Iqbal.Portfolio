/**
 * Text effects: word-mask reveals, count-up numbers and a short "decrypt" scramble.
 * All of them leave the final, real text in the DOM.
 */

/**
 * Wrap each word in a mask so it can rise into place.
 * Words (not letters) are wrapped, and the spaces between them stay as text,
 * so screen readers and copy/paste still get normal sentences.
 */
export function splitWords(el) {
  if (el.classList.contains("is-split")) return;
  let index = 0;

  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const mask = document.createElement("span");
          mask.className = "w";
          const inner = document.createElement("span");
          inner.className = "wi";
          inner.style.setProperty("--i", index++);
          inner.textContent = part;
          mask.appendChild(inner);
          frag.appendChild(mask);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };

  walk(el);
  el.classList.add("is-split");
}

/** Count from 0 to the element's data-count value, keeping its number format. */
export function countUp(el, duration = 1600) {
  const target = parseFloat(el.dataset.count);
  if (Number.isNaN(target)) return;
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const format = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const final = el.textContent;
  const start = performance.now();

  const frame = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = p < 1 ? format.format(target * eased) : final;
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const GLYPHS = "ABCDEF0123456789#/<>_-";

/** Briefly scramble a short label, then resolve it left to right. */
export function scramble(el, duration = 700) {
  if (el.dataset.scrambling) return;
  const final = el.textContent;
  el.dataset.scrambling = "1";
  const start = performance.now();

  const frame = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const solved = Math.floor(final.length * p);
    let out = final.slice(0, solved);
    for (let i = solved; i < final.length; i++) {
      out += /\s/.test(final[i]) ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = p < 1 ? out : final;
    if (p < 1) requestAnimationFrame(frame);
    else delete el.dataset.scrambling;
  };
  requestAnimationFrame(frame);
}
