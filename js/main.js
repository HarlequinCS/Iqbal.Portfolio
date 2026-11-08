/* Saiful Iqbal — Portfolio v2. No dependencies. Every feature is optional:
   the page works fully without JavaScript. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    function label() {
      btn.setAttribute("aria-label", currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    label();
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked: theme still applies for this visit */ }
      var meta = document.querySelectorAll('meta[name="theme-color"]');
      meta.forEach(function (m) { m.setAttribute("content", next === "dark" ? "#111315" : "#F3F1EC"); m.removeAttribute("media"); });
      label();
    });
  });

  /* ---------- Mobile menu ---------- */
  var nav = document.querySelector(".nav");
  var menuBtn = document.querySelector(".menu-toggle");
  if (nav && menuBtn) {
    var setOpen = function (open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      var use = menuBtn.querySelector("use");
      if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
    };
    menuBtn.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") { setOpen(false); menuBtn.focus(); }
    });
  }

  /* ---------- Active section in nav ---------- */
  var navLinks = document.querySelectorAll('.nav-list a[href^="#"]');
  if (navLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var active = null;
      navLinks.forEach(function (a) {
        var id = a.getAttribute("href").slice(1);
        if (!active && visible[id]) active = id;
      });
      navLinks.forEach(function (a) {
        if (a.getAttribute("href").slice(1) === active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Project filters ---------- */
  var filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    var buttons = filterBar.querySelectorAll(".filter-btn");
    var items = document.querySelectorAll("#work [data-category]");
    var groups = document.querySelectorAll("#work .work-group");

    var matches = function (el, f) {
      return f === "all" || (" " + el.getAttribute("data-category") + " ").indexOf(" " + f + " ") !== -1;
    };

    buttons.forEach(function (btn) {
      var f = btn.getAttribute("data-filter");
      var n = 0;
      items.forEach(function (el) { if (matches(el, f)) n++; });
      var c = btn.querySelector(".count");
      if (c) c.textContent = n;
      if (!n) btn.hidden = true;
    });

    var apply = function (f) {
      items.forEach(function (el) { el.hidden = !matches(el, f); });
      groups.forEach(function (g) {
        var shown = g.querySelectorAll("[data-category]:not([hidden])").length;
        g.hidden = shown === 0;
        var meta = g.querySelector(".sub-head .meta[data-count]");
        if (meta) meta.textContent = shown + (shown === 1 ? " project" : " projects");
      });
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        apply(btn.getAttribute("data-filter"));
      });
    });
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.querySelector("span");
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function (ok) {
        if (!label) return;
        label.textContent = ok ? "Copied" : "Press Ctrl+C";
        setTimeout(function () { label.textContent = "Copy"; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  });

  /* ---------- Contact form ----------
     No secrets in the browser. With data-endpoint set (a form service such as
     Formspree), the message is POSTed there. Otherwise the visitor's email app
     opens with the message pre-filled. */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    var note = document.getElementById("form-note");
    var endpoint = (form.getAttribute("data-endpoint") || "").trim();
    var mailto = form.getAttribute("data-mailto");
    if (endpoint && note) note.textContent = "Your message is sent straight to my inbox.";

    var say = function (msg, state) {
      status.textContent = msg;
      status.setAttribute("data-state", state || "");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();

      var firstInvalid = null;
      [form.elements.name, form.elements.email, form.elements.message].forEach(function (f) {
        var bad = !f.value.trim() || (f.type === "email" && !f.checkValidity());
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        say("Please add your name, a valid email address and a message.", "error");
        firstInvalid.focus();
        return;
      }

      if (!endpoint) {
        var subject = "Portfolio enquiry from " + name;
        var body = message + "\n\n" + name + "\n" + email;
        window.location.href = "mailto:" + mailto + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        say("Your email app should open with the message ready to send. If it doesn't, email me at " + mailto + ".", "ok");
        return;
      }

      var submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      say("Sending…");
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: message })
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        say("Thanks, " + name + ". Your message has been sent and I'll reply by email.", "ok");
      }).catch(function () {
        say("Sorry, that didn't send. Please email me at " + mailto + ".", "error");
      }).then(function () {
        submit.disabled = false;
      });
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
