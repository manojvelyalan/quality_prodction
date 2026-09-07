/* ===========================================================
   Quality Space - interactions
   =========================================================== */
(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Nav overlay ---------- */
  const burger = document.getElementById("burger");
  const overlay = document.getElementById("navOverlay");
  const toggleNav = (force) => {
    const open = force ?? !overlay.classList.contains("open");
    overlay.classList.toggle("open", open);
    burger.classList.toggle("active", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleNav());
  const navClose = document.getElementById("navClose");
  if (navClose) navClose.addEventListener("click", () => toggleNav(false));
  overlay.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleNav(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleNav(false); });

  /* ---------- Stat counters ---------- */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const runCounter = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const target = parseInt(el.dataset.count, 10);
    const dur = 1600;
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      el.textContent = String(Math.floor(easeOut(p) * target));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Scroll reveal + counters (resilient) ----------
     Uses IntersectionObserver where it works, plus a capture-phase
     scroll fallback so it also fires inside non-standard scroll
     containers (previews, embeds, some mobile browsers).            */
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  const stats = Array.from(document.querySelectorAll(".stat-num"));

  const showEl = (el) => el.classList.add("in");

  const sweep = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) showEl(el);
    });
    stats.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > 0) runCounter(el);
    });
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          if (en.target.classList.contains("stat-num")) runCounter(en.target);
          else showEl(en.target);
          obs.unobserve(en.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
    stats.forEach((el) => io.observe(el));
  } else {
    reveals.forEach(showEl);
    stats.forEach(runCounter);
  }

  window.addEventListener("scroll", sweep, { passive: true });
  document.addEventListener("scroll", sweep, { passive: true, capture: true });
  window.addEventListener("wheel", () => requestAnimationFrame(sweep), { passive: true });
  window.addEventListener("touchmove", () => requestAnimationFrame(sweep), { passive: true });
  window.addEventListener("resize", sweep, { passive: true });
  window.addEventListener("load", sweep);
  sweep();
  // Short poll to cover embeds/previews that don't emit scroll events.
  let ticks = 0;
  const poll = setInterval(() => {
    sweep();
    if (++ticks > 40 || (!reveals.some((e) => !e.classList.contains("in")))) clearInterval(poll);
  }, 250);

  /* ---------- Products: tab-driven bento carousel ---------- */
  const IMG = "https://images.unsplash.com/photo-";
  const q = "?auto=format&fit=crop&w=1100&q=80";
  const PRODUCTS = {
    SHADE: [
      { t: "Cassette Awnings", i: "1600607687939-ce8a6c25118c" },
      { t: "Vertical Awnings", i: "1616486338812-3dadae4b4ace" },
      { t: "Roller Shutters", i: "1600566753190-17f0baa2a6c3" },
      { t: "External Venetian Blinds", i: "1582268611958-ebfd161ef9cf" },
      { t: "Facade Awnings", i: "1487958449943-2429e8be8625" },
    ],
    "OUTDOOR LIVING": [
      { t: "Bioclimatic Pergolas", i: "1600210492486-724fe5c67fb0" },
      { t: "Retractable Roofs", i: "1613490493576-7fde63acd811" },
      { t: "Garden Rooms", i: "1600585154340-be6161a56a0c" },
      { t: "Outdoor Blinds", i: "1600607687920-4e2a09cf159d" },
      { t: "Louvered Canopies", i: "1512917774080-9991f1c4c750" },
    ],
    INTERIOR: [
      { t: "Roller Blinds", i: "1616627561839-074385245ff6" },
      { t: "Roman Blinds", i: "1616486029423-aaa4789e8c9a" },
      { t: "Motorised Curtains", i: "1615874959474-d609969a20ed" },
      { t: "Panel Glide Systems", i: "1616137466211-f939a420be84" },
      { t: "Wooden Venetians", i: "1615873968403-89e068629265" },
    ],
    PROTECTION: [
      { t: "Insect Screens", i: "1600494603989-9650cf6dad51" },
      { t: "Security Shutters", i: "1600566752355-35792bedcfea" },
      { t: "Storm Shades", i: "1580237072617-771c3ecc4a24" },
      { t: "Pool Enclosures", i: "1571896349842-33c89424de2d" },
      { t: "Privacy Screens", i: "1600047509807-ba8f99d2cdde" },
    ],
  };

  const tiles = Array.from(document.querySelectorAll("[data-tile]"));
  const tilesWrap = document.getElementById("tilesWrap");
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));

  const paintTiles = (key) => {
    const set = PRODUCTS[key];
    tiles.forEach((tile, idx) => {
      const d = set[idx];
      if (!d) return;
      const img = tile.querySelector("img");
      const label = tile.querySelector("[data-label]");
      if (img) { img.src = IMG + d.i + q; img.alt = d.t; }
      if (label) label.textContent = d.t;
    });
  };

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (tilesWrap) tilesWrap.classList.add("swapping");
      setTimeout(() => {
        paintTiles(btn.dataset.tab);
        if (tilesWrap) tilesWrap.classList.remove("swapping");
      }, 340);
    });
  });

  /* ---------- Projects - coverflow carousel ----------
     Leftmost slide is featured (colour, expanded); the rest are
     shrunk + greyscale. Advancing promotes the next slide into the
     featured spot. Loops infinitely via a duplicated slide list.   */
  const cf = document.getElementById("pCoverflow");
  const track = document.getElementById("pTrack");
  const dotsWrap = document.getElementById("pDots");
  const linesWrap = document.getElementById("pLines");

  if (cf && track) {
    const PROJECTS = [
      {
        t: "Sowwah Square Island",
        p: "Financial Center – 4 Towers",
        s: "Venetian Blinds at Double Skin Facade",
        img: "https://images.adsttc.com/media/images/51de/2ce5/e8e4/4eed/7200/007c/newsletter/SowwahSquare_Ext-SecuritiesExchange%28ADX%29Headuarters_%28c%29MubadalaRealEstate_Infrastructure.jpg?1373514967",
      },
      {
        t: "Arcapita",
        p: "Head Quarter",
        s: "Day Light Guiding Blinds with Annual Shading",
        img: "https://www.som.com/wp-content/uploads/2021/08/205280_000_N231_large-scaled.jpg",
      },
      {
        t: "Sowwah Square Island",
        p: "Stock Exchange",
        s: "Motorized Shades",
        img: "https://images.adsttc.com/media/images/51de/2c83/e8e4/4ef6/4a00/007a/large_jpg/SowwahSquare_Ext-TowerBase_%28c%29LesterAli.jpg?1373514864",
      },
      {
        t: "Etihad Towers",
        p: "Abu Dhabi",
        s: "Motorized Roller Shade",
        img: "https://aecom.com/wp-content/uploads/2017/01/ETIHAD-SSN1_034.jpg",
      },
      {
        t: "Aldar",
        p: "Head Quarter FLR 11, 12 & 13",
        s: "Special Shaped Shades",
        img: "https://images.squarespace-cdn.com/content/v1/61f3e4fe46e4ed1160bd6275/31003b69-90f1-4dcd-bbfd-52b368a5c0f3/4.jpg",
      },
      {
        t: "Central Market",
        p: "Abu Dhabi",
        s: "Venetian Blinds at Double Skin Facade",
        img: "https://images.adsttc.com/media/images/5444/7279/c07a/801f/e700/0584/newsletter/1431_FP442311.jpg?1413771868",
      },
      {
        t: "Etisalat Bld.",
        p: "Al Kifaf",
        s: "Roller Shades",
        img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlpz98uuJWaWQyhz_9HWqZf2YNPkgumh-qEcsZanheWXMiI7sevqzaqUaN&s=10",
      },
      {
        t: "LOUVRE ABUDHABI MUSEUM",
        p: "Saadiyat Island",
        s: "Motorized Shades",
        img: "https://images.trvl-media.com/place/553248621560904133/0b49858a-e085-449c-bd25-6d8fab79e2d8.jpg",
      },
      {
        t: "Kempinski Hotel Palm Jumeirah",
        p: "Palm Jumeirah",
        s: "Cassette Awnings",
        img: "https://res.klook.com/klook-hotel/image/upload/w_750,c_fill,q_85/travelapi/4000000/3570000/3565900/3565885/22c51a57_z.jpg",
      },
      {
        t: "XXII Carat Club Villas",
        p: "Palm Jumeirah",
        s: "Conservatory Awnings",
        img: "https://xxiicarat.ae/amenities-1.jpg",
      },
    ];
    const N = PROJECTS.length;

    // accent lines: 3 thick bars (red / terracotta / tan) then 8 thin grey rules
    if (linesWrap) {
      const rows = [
        { cls: "bar" },
        { cls: "thick", c: "#bd7259" },
        { cls: "thick", c: "#d3a48f" },
        { c: "#bfbfbf" }, { c: "#c2c2c2" }, { c: "#c2c2c2" }, { c: "#c5c5c5" },
        { c: "#c5c5c5" }, { c: "#c8c8c8" }, { c: "#cbcbcb" }, { c: "#cecece" },
      ];
      rows.forEach((r) => {
        const i = document.createElement("i");
        if (r.cls) i.className = r.cls;
        if (r.c) i.style.setProperty("--c", r.c);
        linesWrap.appendChild(i);
      });
    }

    // build slides (x2 for seamless looping)
    const buildSlide = (d) => {
      const a = document.createElement("article");
      a.className = "qs-cf-slide";
      const imgSrc = d.img ? d.img : (d.i ? `${IMG}${d.i}?auto=format&fit=crop&w=1400&q=80` : "");
      a.innerHTML =
        `<img src="${imgSrc}" alt="${d.t} - ${d.s || d.p}" loading="lazy" />` +
        `<div class="veil"></div>` +
        `<div class="cap">` +
        `<b>${d.t}</b>` +
        `<span>${d.p}</span>` +
        (d.s ? `<span class="sol-badge">${d.s}</span>` : "") +
        `</div>` +
        `<a href="projects.html" class="arrow" aria-label="View ${d.t}">` +
        `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>` +
        `</a>`;
      return a;
    };
    PROJECTS.concat(PROJECTS).forEach((d) => track.appendChild(buildSlide(d)));
    const slides = Array.from(track.children);

    // dots
    const dots = [];
    for (let k = 0; k < N; k++) {
      const b = document.createElement("button");
      b.className = "pdot";
      b.setAttribute("aria-label", "Go to project " + (k + 1));
      b.addEventListener("click", () => go(k, true));
      dotsWrap.appendChild(b);
      dots.push(b);
    }

    let active = 0;
    let timer = null;
    const styles = getComputedStyle(cf);
    const stepPx = () =>
      parseFloat(styles.getPropertyValue("--narrow")) +
      parseFloat(styles.getPropertyValue("--gap"));

    const paint = (animate) => {
      track.style.transition = animate ? "" : "none";
      track.style.transform = `translateX(-${active * stepPx()}px)`;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === active));
      dots.forEach((d, i) => d.classList.toggle("active", i === active % N));
      if (!animate) void track.offsetWidth; // flush
    };

    function go(n, user) {
      active = n;
      paint(true);
      if (user) restart();
    }
    // after the animated step, silently rewind out of the duplicate half
    track.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "transform") return;
      if (active >= N) { active -= N; paint(false); }
      else if (active < 0) { active += N; paint(false); }
    });

    const next = (user) => go(active + 1, user);
    const prev = (user) => go(active - 1, user);
    const restart = () => {
      clearInterval(timer);
      timer = setInterval(() => next(false), 4500);
    };

    document.getElementById("pNext").addEventListener("click", () => next(true));
    document.getElementById("pPrev").addEventListener("click", () => prev(true));

    // drag / swipe (requires real pointer movement)
    let x0 = null, dragging = false, moved = 0;
    const down = (x) => { x0 = x; dragging = true; moved = 0; };
    const move = (x) => { if (dragging) moved = x - x0; };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(moved) > 45) (moved < 0 ? next : prev)(true);
      moved = 0;
    };
    track.addEventListener("mousedown", (e) => { e.preventDefault(); down(e.clientX); });
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", up);
    track.addEventListener("touchstart", (e) => down(e.touches[0].clientX), { passive: true });
    track.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
    track.addEventListener("touchend", up);

    // wheel / scroll over the carousel steps it (desktop pointers only)
    if (window.matchMedia("(hover: hover)").matches) {
      let acc = 0, lock = false, ready = false;
      setTimeout(() => (ready = true), 500);
      cf.addEventListener(
        "wheel",
        (e) => {
          if (!ready) return;
          const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          if ((d > 0) !== (acc > 0)) acc = 0; // direction flip resets
          acc += d;
          e.preventDefault();
          if (lock || Math.abs(acc) < 110) return;
          (acc > 0 ? next : prev)(true);
          acc = 0;
          lock = true;
          setTimeout(() => (lock = false), 640);
        },
        { passive: false }
      );
    }

    cf.addEventListener("mouseenter", () => clearInterval(timer));
    cf.addEventListener("mouseleave", restart);
    window.addEventListener("resize", () => paint(false));

    paint(false);
    restart();
  }

  /* ---------- Year ---------- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
