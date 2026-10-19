"use strict";

/* ==========================================================
   Helpers
   ========================================================== */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

const root = document.documentElement;

/* ==========================================================
   1) Active link في الـ Navbar حسب الـ Section الظاهر
   ========================================================== */
(function initActiveLink() {
  const links = $$(".nav-links a[href^='#']");
  const sections = links
    .map((link) => $(link.getAttribute("href")))
    .filter(Boolean);
  if (!links.length || !sections.length) return;

  const OFFSET = 140; // ارتفاع الـ navbar + هامش بسيط
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY + OFFSET;
    let current = sections[0];

    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= y) current = section;
    });

    // لو وصلنا لآخر الصفحة نفعّل آخر Section
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;
    if (atBottom) current = sections[sections.length - 1];

    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", update);
  update();
})();

/* ==========================================================
   2) Dark Mode / Light Mode
   ========================================================== */
(function initTheme() {
  const button = $("#theme-toggle-button");
  const saved = store.get("theme");

  if (saved === "dark") root.classList.add("dark");
  else if (saved === "light") root.classList.remove("dark");
  // لو مفيش قيمة محفوظة بنسيب الـ class الموجود في الـ HTML زي ما هو

  function sync() {
    if (button) {
      button.setAttribute(
        "aria-pressed",
        String(root.classList.contains("dark"))
      );
    }
  }

  button?.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    store.set("theme", isDark ? "dark" : "light");
    sync();
  });

  sync();
})();

/* ==========================================================
   3) Portfolio Tabs (Filter)
   ========================================================== */
(function initPortfolioTabs() {
  const buttons = $$(".portfolio-filter");
  const items = $$(".portfolio-item");
  if (!buttons.length || !items.length) return;

  const ACTIVE = ["bg-linear-to-r", "from-primary", "to-secondary", "text-white"];
  const INACTIVE = [
    "bg-white",
    "dark:bg-slate-800",
    "text-slate-600",
    "dark:text-slate-300",
  ];

  function setActive(selected) {
    buttons.forEach((btn) => {
      const on = btn === selected;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
      ACTIVE.forEach((c) => btn.classList.toggle(c, on));
      INACTIVE.forEach((c) => btn.classList.toggle(c, !on));
    });
  }

  function filter(category) {
    items.forEach((item) => {
      const show = category === "all" || item.dataset.category === category;
      item.classList.toggle("hidden", !show);
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActive(btn);
      filter(btn.dataset.filter);
    });
  });
})();

/* ==========================================================
   4) Testimonials Carousel
   ========================================================== */
(function initCarousel() {
  const track = $("#testimonials-carousel");
  const nextBtn = $("#next-testimonial");
  const prevBtn = $("#prev-testimonial");
  const cards = $$(".testimonial-card", track || document);
  const dotsWrap = $(".carousel-indicator")?.parentElement;
  if (!track || !cards.length) return;

  const DOT_BASE =
    "carousel-indicator w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 cursor-pointer";
  const DOT_ON = "bg-accent";
  const DOT_OFF = "bg-slate-400 dark:bg-slate-600";

  let index = 0;
  let perView = 1;
  let maxIndex = 0;
  let timer = null;

  function calcPerView() {
    const w = window.innerWidth;
    if (w >= 1024) return 3;
    if (w >= 640) return 2;
    return 1;
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.dataset.index = String(i);
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `التوصية ${i + 1}`);
      dot.addEventListener("click", () => {
        goTo(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    }
  }

  function render() {
    const step = cards[0].offsetWidth;
    // الصفحة RTL فالـ track بيبدأ من اليمين، يعني الإزاحة بتبقى موجبة
    track.style.transform = `translateX(${index * step}px)`;

    $$(".carousel-indicator", dotsWrap || document).forEach((dot, i) => {
      const on = i === index;
      dot.className = `${DOT_BASE} ${on ? DOT_ON : DOT_OFF}`;
      dot.setAttribute("aria-selected", String(on));
    });
  }

  function goTo(i) {
    if (i > maxIndex) i = 0; // رجوع للأول
    if (i < 0) i = maxIndex; // رجوع للآخر
    index = i;
    render();
  }

  function layout() {
    perView = calcPerView();
    maxIndex = Math.max(0, cards.length - perView);
    if (index > maxIndex) index = maxIndex;
    buildDots();
    render();
  }

  function start() {
    stop();
    timer = setInterval(() => goTo(index + 1), 5000);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restart() {
    start();
  }

  nextBtn?.addEventListener("click", () => {
    goTo(index + 1);
    restart();
  });
  prevBtn?.addEventListener("click", () => {
    goTo(index - 1);
    restart();
  });

  // إيقاف التشغيل التلقائي أثناء الـ hover أو التركيز
  const area = track.parentElement;
  area.addEventListener("mouseenter", stop);
  area.addEventListener("mouseleave", start);
  area.addEventListener("focusin", stop);
  area.addEventListener("focusout", start);

  // Swipe على الموبايل
  let startX = 0;
  let dragging = false;
  area.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      dragging = true;
      stop();
    },
    { passive: true }
  );
  area.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      // في RTL السحب لليمين = التالي
      goTo(diff > 0 ? index + 1 : index - 1);
    }
    start();
  });

  window.addEventListener("resize", layout);
  layout();
  start();
})();

/* ==========================================================
   5) Settings Sidebar (Theme Colors + Fonts)
   ========================================================== */
(function initSettings() {
  const toggle = $("#settings-toggle");
  const sidebar = $("#settings-sidebar");
  const closeBtn = $("#close-settings");
  const resetBtn = $("#reset-settings");
  const colorsGrid = $("#theme-colors-grid");
  const fontButtons = $$(".font-option");
  if (!toggle || !sidebar) return;

  /* ---------- فتح وإغلاق ---------- */
  function setOpen(open) {
    sidebar.classList.toggle("translate-x-full", !open);
    sidebar.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    if (open) sidebar.removeAttribute("inert");
    else sidebar.setAttribute("inert", "");
  }

  toggle.addEventListener("click", () =>
    setOpen(sidebar.classList.contains("translate-x-full"))
  );
  closeBtn?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", (e) => {
    const isOpen = !sidebar.classList.contains("translate-x-full");
    if (isOpen && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      setOpen(false);
    }
  });
  setOpen(false);

  /* ---------- الألوان ---------- */
  const THEMES = [
    { name: "نيلي", primary: "#6366f1", secondary: "#8b5cf6", accent: "#ec4899" },
    { name: "أزرق", primary: "#3b82f6", secondary: "#06b6d4", accent: "#8b5cf6" },
    { name: "أخضر", primary: "#10b981", secondary: "#14b8a6", accent: "#f59e0b" },
    { name: "وردي", primary: "#f43f5e", secondary: "#fb7185", accent: "#f59e0b" },
    { name: "برتقالي", primary: "#f97316", secondary: "#f59e0b", accent: "#ef4444" },
    { name: "بنفسجي", primary: "#a855f7", secondary: "#d946ef", accent: "#06b6d4" },
    { name: "سماوي", primary: "#06b6d4", secondary: "#0ea5e9", accent: "#6366f1" },
    { name: "تركواز", primary: "#14b8a6", secondary: "#22c55e", accent: "#3b82f6" },
  ];
  const DEFAULT_THEME = 0;

  function applyColor(i) {
    const t = THEMES[i] || THEMES[DEFAULT_THEME];
    root.style.setProperty("--color-primary", t.primary);
    root.style.setProperty("--color-secondary", t.secondary);
    root.style.setProperty("--color-accent", t.accent);

    $$("button", colorsGrid).forEach((btn, idx) => {
      const on = idx === i;
      btn.setAttribute("aria-checked", String(on));
      ["ring-2", "ring-primary", "ring-offset-2", "ring-offset-white", "dark:ring-offset-slate-900"].forEach(
        (c) => btn.classList.toggle(c, on)
      );
      $("i", btn)?.classList.toggle("opacity-0", !on);
    });
  }

  if (colorsGrid) {
    colorsGrid.setAttribute("role", "radiogroup");
    colorsGrid.innerHTML = "";
    THEMES.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-label", t.name);
      btn.title = t.name;
      btn.className =
        "w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110";
      btn.style.background = `linear-gradient(135deg, ${t.primary}, ${t.secondary})`;
      btn.innerHTML =
        '<i class="fa-solid fa-check text-sm opacity-0" aria-hidden="true"></i>';
      btn.addEventListener("click", () => {
        applyColor(i);
        store.set("theme-color", String(i));
      });
      colorsGrid.appendChild(btn);
    });
  }

  /* ---------- الخطوط ---------- */
  const FONTS = ["alexandria", "tajawal", "cairo"];
  const DEFAULT_FONT = "tajawal";

  function applyFont(name) {
    if (!FONTS.includes(name)) name = DEFAULT_FONT;
    FONTS.forEach((f) => document.body.classList.remove(`font-${f}`));
    document.body.classList.add(`font-${name}`);

    fontButtons.forEach((btn) => {
      const on = btn.dataset.font === name;
      btn.classList.toggle("active", on);
      btn.classList.toggle("border-primary", on);
      btn.classList.toggle("bg-primary/10", on);
      btn.setAttribute("aria-checked", String(on));
    });
  }

  fontButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFont(btn.dataset.font);
      store.set("theme-font", btn.dataset.font);
    });
  });

  /* ---------- إعادة الضبط ---------- */
  resetBtn?.addEventListener("click", () => {
    store.remove("theme-color");
    store.remove("theme-font");
    applyColor(DEFAULT_THEME);
    applyFont(DEFAULT_FONT);
  });

  /* ---------- تحميل المحفوظ ---------- */
  const savedColor = parseInt(store.get("theme-color"), 10);
  applyColor(Number.isInteger(savedColor) ? savedColor : DEFAULT_THEME);
  applyFont(store.get("theme-font") || DEFAULT_FONT);
})();

/* ==========================================================
   6) Scroll To Top
   ========================================================== */
(function initScrollTop() {
  const button = $("#scroll-to-top");
  if (!button) return;

  const THRESHOLD = 400;
  let ticking = false;

  function update() {
    ticking = false;
    const show = window.scrollY > THRESHOLD;
    button.classList.toggle("opacity-0", !show);
    button.classList.toggle("invisible", !show);
    button.classList.toggle("opacity-100", show);
    button.classList.toggle("visible", show);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  update();
})();