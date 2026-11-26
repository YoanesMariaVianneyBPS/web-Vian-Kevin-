/* Content lives in content/essays.json and content/site.json.
   Edit it in Pages CMS (app.pagescms.org); .pages.yml describes the fields. */
let ESSAYS = [];
let SITE = null;

const UI = {
  id: {
    skip: "Lewati ke konten", menu: "Buka menu", navLabel: "Menu utama", langLabel: "Bahasa",
    nav: { home: "Beranda", essays: "Esai", about: "Tentang", contact: "Kontak" },
    heroAlt: "Potret hitam putih Yoanes Vianney, tersenyum, memakai kalung salib",
    verse: "“Sesungguhnya aku ini hamba Tuhan; jadilah padaku menurut perkataan-Mu itu.”",
    ref: "Lukas 1:38",
    script: "Jurnal Esai", essaysH: "Esai",
    filterLabel: "Saring esai menurut topik", all: "Semua",
    prev: "Geser esai ke kiri", next: "Geser esai ke kanan", track: "Esai, geser ke samping",
    read: "Baca esai", by: "Oleh Yoanes Vianney", essay: "Esai",
    aboutAlt: "Swafoto hitam putih Yoanes memegang kamera film di depan wajahnya",
    social: "Sosial", back: "Semua esai", prevE: "Esai sebelumnya", nextE: "Esai berikutnya", more: "Esai lainnya",
    todo: "[ISI DI SINI] Teks lengkap esai ini belum ditambahkan.",
    pageOf: (n, t) => `Halaman ${n} dari ${t}`,
    loading: "Memuat esai…", failed: "Esai belum bisa dimuat. Periksa koneksi lalu coba lagi.", retry: "Coba lagi", none: "Belum ada esai.",
    emptyA: "Belum ada esai dengan topik", showAll: "Tampilkan semua esai",
    topics: { holiness: "Kekudusan", eucharist: "Ekaristi" },
    title: "Yoanes Vianney — Esai tentang kekudusan, Pengakuan Dosa, dan Ekaristi",
    desc: "Esai dan catatan pengajaran Yoanes Vianney tentang kekudusan, Pengakuan Dosa, dan Ekaristi."
  },
  en: {
    skip: "Skip to content", menu: "Open menu", navLabel: "Main menu", langLabel: "Language",
    nav: { home: "Home", essays: "Essays", about: "About", contact: "Contact" },
    heroAlt: "Black and white portrait of Yoanes Vianney, smiling, wearing a cross necklace",
    verse: "“I am the Lord’s servant,” Mary answered. “May your word to me be fulfilled.”",
    ref: "Luke 1:38",
    script: "The Essay Journal", essaysH: "Featured Essays",
    filterLabel: "Filter essays by topic", all: "All",
    prev: "Scroll essays left", next: "Scroll essays right", track: "Essays, scroll sideways",
    read: "Read essay", by: "By Yoanes Vianney", essay: "Essay",
    aboutAlt: "Black and white self-portrait of Yoanes holding a film camera in front of his face",
    social: "Social", back: "All essays", prevE: "Previous essay", nextE: "Next essay", more: "More essays",
    todo: "[ISI DI SINI] The full text of this essay has not been added yet.",
    pageOf: (n, t) => `Page ${n} of ${t}`,
    loading: "Loading essays…", failed: "The essays could not be loaded. Check your connection and try again.", retry: "Try again", none: "No essays yet.",
    emptyA: "No essays under", showAll: "Show all essays",
    topics: { holiness: "Holiness", eucharist: "Eucharist" },
    title: "Yoanes Vianney — Essays on holiness, Confession and the Eucharist",
    desc: "Essays and teaching notes by Yoanes Vianney on holiness, Confession and the Eucharist."
  }
};

const $ = (s, r = document) => r.querySelector(s);
const home = $("#view-home"), art = $("#view-article");
let lang = "id";
try { const saved = localStorage.getItem("lang"); if (saved === "id" || saved === "en") lang = saved; } catch (e) {}
let activeTopic = "all";

const T = () => UI[lang];
const pick = o => o[lang];
const get = (obj, path) => path.split(".").reduce((o, k) => o && o[k], obj);
const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = n => String(n).padStart(2, "0");
const href = e => "#essay-" + e.slug;
const src = p => (p || "").replace(/^\/+/, "");
const topicsList = () => ["all", ...new Set(ESSAYS.map(e => e.topic))];
const topicName = k => k === "all" ? T().all : (T().topics[k] || k);

function applyStatic() {
  const ui = T();
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = get(ui, el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = get(ui, el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-alt]").forEach(el => { el.alt = get(ui, el.dataset.i18nAlt); });
  document.querySelectorAll("[data-i18n-label]").forEach(el => { el.setAttribute("aria-label", get(ui, el.dataset.i18nLabel)); });
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  $('meta[name="description"]').content = ui.desc;
}

function renderFilters() {
  $("#filters").innerHTML = topicsList().map(k =>
    `<button type="button" data-topic="${esc(k)}" aria-pressed="${k === activeTopic}">${esc(topicName(k))}</button>`).join("");
}

function renderList() {
  const list = ESSAYS.map((e, i) => ({ ...e, n: i + 1 })).filter(e => activeTopic === "all" || e.topic === activeTopic);
  const box = $("#essay-list");
  const ui = T();
  if (state === "loading") { box.innerHTML = `<p class="empty">${esc(ui.loading)}</p>`; updateArrows(); return; }
  if (state === "error") { box.innerHTML = `<p class="empty">${esc(ui.failed)} <button type="button" id="retry">${esc(ui.retry)}</button></p>`; updateArrows(); return; }
  if (!ESSAYS.length) { box.innerHTML = `<p class="empty">${esc(ui.none)}</p>`; updateArrows(); return; }
  if (!list.length) {
    box.innerHTML = `<p class="empty">${esc(ui.emptyA)} “${esc(topicName(activeTopic))}”. <button type="button" data-topic="all">${esc(ui.showAll)}</button></p>`;
    updateArrows();
    return;
  }
  box.innerHTML = `<ol class="track" id="track" tabindex="0" aria-label="${esc(ui.track)}">` +
    list.map(e =>
      `<li class="card">
         <a href="${href(e)}">
           <figure><img src="${esc(src(e.img))}" alt="${esc(pick(e.alt) || "")}" loading="lazy" width="360" height="450"></figure>
           <div class="meta">
             <span class="eyebrow"><b>${pad(e.n)}</b> &nbsp;|&nbsp; ${esc(topicName(e.topic))}</span>
             <h3>${esc(pick(e.title))}</h3>
             <p class="ex">${esc(pick(e.excerpt))}</p>
             <p class="by">${esc(ui.by)}</p>
             <span class="read">${esc(ui.read)} ${ARROW}</span>
           </div>
         </a>
       </li>`).join("") + `</ol>`;
  $("#track").addEventListener("scroll", updateArrows, { passive: true });
  updateArrows();
  revealCards();
}

function updateArrows() {
  const t = $("#track");
  const max = t ? t.scrollWidth - t.clientWidth - 2 : 0;
  const canScroll = !!t && t.scrollWidth > t.clientWidth + 2;
  $(".arrows").hidden = !canScroll;
  $("#prev").disabled = !t || t.scrollLeft <= 2;
  $("#next").disabled = !t || t.scrollLeft >= max;
}

function slide(dir) {
  const t = $("#track");
  if (!t) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  t.scrollBy({ left: dir * t.clientWidth * 0.8, behavior: calm ? "auto" : "smooth" });
}

function renderLatest() {
  const e = ESSAYS[0];
  $("#paper").hidden = !e;
  if (!e) return;
  $("#paper").href = href(e);
  $("#paper-k").textContent = T().essay + " " + pad(1);
  $("#paper-t").textContent = pick(e.title);
  $("#paper-img").src = src(e.img);
}

function renderArticle(slug) {
  const i = ESSAYS.findIndex(e => e.slug === slug);
  if (i < 0) return false;
  const e = ESSAYS[i], ui = T();
  const body = (pick(e.body) || "").trim();
  $("#a-topic").textContent = topicName(e.topic);
  $("#a-title").textContent = pick(e.title);
  $("#a-pull").textContent = pick(e.excerpt);
  const pages = Array.isArray(e.pages) ? e.pages : [];
  $("#a-body").innerHTML = body || pages.length ? body : `<p class="todo">${esc(ui.todo)}</p>`;
  $("#a-deck").innerHTML = pages.map((u, n) =>
    `<img src="${esc(src(u))}" width="1280" height="720" loading="${n < 2 ? "eager" : "lazy"}" decoding="async" alt="${esc(ui.pageOf(n + 1, pages.length))}">`).join("");
  document.querySelectorAll("#a-deck img").forEach(im => { im.classList.remove("reveal", "in"); im.style.transitionDelay = ""; watch(im); });
  const prev = ESSAYS[i - 1], next = ESSAYS[i + 1];
  $("#a-pager").innerHTML =
    (prev ? `<a href="${href(prev)}"><span class="eyebrow">${esc(ui.prevE)}</span><span>${esc(pick(prev.title))}</span></a>` : `<div></div>`) +
    (next ? `<a href="${href(next)}"><span class="eyebrow">${esc(ui.nextE)}</span><span>${esc(pick(next.title))}</span></a>` : `<div></div>`);
  document.title = pick(e.title) + " — Yoanes Vianney";
  return true;
}


/* ---- reveal on scroll (skipped entirely when the visitor prefers reduced motion) ---- */
const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window;
let seenCards = false;
let io = null;
function watch(el, delay = 0) {
  if (!animate || !el) return;
  if (el.classList.contains("in")) return;
  el.classList.add("reveal");
  el.style.transitionDelay = delay + "ms";
  io.observe(el);
}
function initReveal() {
  if (!animate) return;
  document.documentElement.classList.add("js-anim");
  io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
      if (en.target.classList.contains("card")) seenCards = true;
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".section-title,.tools,.verse,.about-photo,.about .wrap>div:last-child").forEach(el => watch(el));
}
function revealCards() {
  if (!animate) return;
  document.querySelectorAll("#track .card").forEach((c, i) => {
    if (seenCards) { c.classList.add("reveal", "in"); return; }
    watch(c, i * 120);
  });
}

let currentSlug = null;
function route() {
  const h = location.hash;
  const m = h.match(/^#essay-([\w-]+)$/);
  if (m && renderArticle(m[1])) {
    currentSlug = m[1];
    home.hidden = true; art.hidden = false;
    art.classList.remove("view-in"); void art.offsetWidth; art.classList.add("view-in");
    window.scrollTo(0, 0);
    $("#a-title").focus({ preventScroll: true });
    return;
  }
  currentSlug = null;
  const wasArticle = !art.hidden;
  art.hidden = true; home.hidden = false;
  document.title = T().title;
  if (wasArticle) {
    const id = h.slice(1);
    const target = id && document.getElementById(id);
    requestAnimationFrame(() => target ? target.scrollIntoView() : window.scrollTo(0, 0));
  }
}

function renderProfile() {
  if (!SITE) return;
  $("#about-h").textContent = SITE.name;
  $("#bio").innerHTML = pick(SITE.bio) || "";
  if (SITE.instagram) $("#ig").href = SITE.instagram;
}

function setLang(next) {
  lang = next;
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyStatic(); renderFilters(); renderList(); renderLatest(); renderProfile();
  if (currentSlug) renderArticle(currentSlug); else document.title = T().title;
}

document.addEventListener("click", ev => {
  if (ev.target.closest("#retry")) { load(); return; }
  const l = ev.target.closest("[data-lang]");
  if (l) { setLang(l.dataset.lang); return; }
  const b = ev.target.closest("[data-topic]");
  if (b) { activeTopic = b.dataset.topic; renderFilters(); renderList(); return; }
  if (ev.target.closest(".nav a")) closeMenu();
});

$("#prev").addEventListener("click", () => slide(-1));
$("#next").addEventListener("click", () => slide(1));
window.addEventListener("resize", updateArrows);

const menuBtn = $(".menu-btn"), nav = $("#nav");
function closeMenu() { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeMenu(); });

$("#year").textContent = new Date().getFullYear();
let state = "loading";
async function load() {
  state = "loading"; renderList();
  try {
    const [e, si] = await Promise.all([
      fetch("content/essays.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw r.status; return r.json(); }),
      fetch("content/site.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);
    ESSAYS = Array.isArray(e) ? e.filter(x => x && x.slug) : [];
    SITE = si;
    state = "ready";
  } catch (err) {
    state = "error";
  }
  renderFilters(); renderList(); renderLatest(); renderProfile(); route();
}

initReveal();
applyStatic(); renderFilters();
window.addEventListener("hashchange", route);
load();
