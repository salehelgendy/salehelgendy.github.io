/* Ramadan interactive file — web edition.
   Features: inline full answers, audio player + listening queue, share-as-image, daily pick by the Umm al-Qura date,
   bookmarks, offline (service worker), text size, popular, QR (qr.html), ask link, related, voice search,
   prayer times, reading progress, short links (f/<slug>/), what's new, search-engine pages. */
(() => {
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("rf:" + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem("rf:" + k, JSON.stringify(v)); } catch (_) {} }
};
const BASE = new URL(".", location.href).href;
const SITE_ASK = "https://saadalkhathlan.com/ask-question";

/* ---------- icons ---------- */
const P = {
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  play: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m22 7-5 4 5 4z"/>',
  mic: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  book: '<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
  dl: '<path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/>',
  tv: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="m17 2-5 5-5-5"/>',
  speech: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  ans: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M18 15l-6-6-6 6"/>',
  vol: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  web: '<circle cx="12" cy="12" r="9.5"/><ellipse cx="12" cy="12" rx="4.2" ry="9.5"/><path d="M2.8 9h18.4M2.8 15h18.4"/>',
  ext: '<path d="M14 3h7v7M10 14 21 3M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
  mark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  ask: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
};
const ic = (k, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`;
const TYPE_IC = { "فتوى": "speech", "مقطع مرئي": "play", "مقطع": "play", "درس أو محاضرة": "book", "درس علمي": "book", "خطبة أو كلمة": "mic", "حلقة تلفزيونية": "tv", "حلقة إذاعية": "mic", "ملف للتحميل": "dl", "تصميم": "img" };
const TYPE_LABEL = { "مقطع مرئي": "مقطع يوتيوب", "مقطع": "مقطع من الموقع" };

/* ---------- i18n (static labels; titles stay Arabic) ---------- */
const I18N = {
  en: { title: "The Interactive <span>Ramadan File</span>", sub: "What every Muslim needs in Ramadan, from the knowledge of Sheikh Prof. Saad bin Turki Al-Khathlan", crumb: "Ramadan file", favs: "Saved", inst: "Install", pers: "Rulings for you:", pw: "Women", ps: "The sick", pt: "Travellers", pi: "Imams & worshippers", pm: "Modern treatments", pop: "Most read", new: "New this week", wird: "Your reading", chapters: "Chapters", qrl: "QR codes to print", askl: "Send your question", shr: "Share image", dl: "Save", cls: "Close" },
  ur: { title: "رمضان کی <span>انٹرایکٹو فائل</span>", sub: "رمضان کے ضروری مسائل، فضیلۃ الشیخ ڈاکٹر سعد بن ترکی الخثلان کے علم سے", crumb: "رمضان فائل", favs: "محفوظ", inst: "انسٹال کریں", pers: "آپ کے لیے احکام:", pw: "خواتین", ps: "مریض", pt: "مسافر", pi: "امام اور نمازی", pm: "جدید علاج", pop: "سب سے زیادہ پڑھے گئے", new: "اس ہفتے نیا", wird: "آپ کی پیش رفت", chapters: "ابواب", qrl: "پرنٹ کے لیے QR", askl: "اپنا سوال بھیجیں", shr: "تصویر شیئر کریں", dl: "محفوظ کریں", cls: "بند کریں" }
};
const AR = {}; document.querySelectorAll("[data-i]").forEach(e => AR[e.dataset.i] = e.innerHTML);
let lang = store.get("lang", "ar");

/* ---------- state ---------- */
let D, ITEMS, ANS, byId = {};
const S = { sec: null, type: null, q: "", p: null, fav: false, open: new Set() };
let favs = new Set(store.get("favs", []));
let read = new Set(store.get("read", []));
const norm = s => s.replace(/[ً-ْٰـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").toLowerCase();
const STOP = new Set(["ما", "هل", "من", "في", "على", "عن", "الي", "او", "ان", "حكم", "التي", "الذي", "مع", "بعد", "قبل", "لا", "كان", "هذا", "ذلك", "وهو", "هو", "هي", "متي", "كيف", "اذا"]);
const words = s => norm(s).replace(/[^ء-يa-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
const PERSONA = {
  woman: { sec: ["الأحكام المتعلقة بالمرأة المسلمة"], kw: ["المرأة", "الحائض", "الحيض", "النفاس", "الحامل", "المرضع", "حبوب"] },
  sick: { kw: ["مريض", "المريض", "المرض", "علاج", "الدواء", "العاجز", "كبير السن", "الكلوي", "الربو", "عقله"] },
  travel: { kw: ["سفر", "المسافر", "مسافر", "السفر"] },
  imam: { sec: ["أحكام صلاتي التراويح والقيام"], kw: ["الإمام", "التراويح", "القنوت", "الوتر"] },
  medical: { sec: ["المفطرات المعاصرة"], kw: ["بخاخ", "قطرة", "الإبر", "الحقن", "الأكسجين", "الغسيل", "المنظار", "المناظير", "التحاليل", "الدم"] }
};
const shortUrl = d => BASE + "f/" + d.slug + "/";
const toast = m => { const el = $("toast"); el.textContent = m; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 1800); };
const markRead = id => { if (!read.has(id)) { read.add(id); store.set("read", [...read]); progress(); rail(); const el = $("m-" + id); if (el) el.classList.add("read"); } };

/* ---------- hijri (Umm al-Qura) ---------- */
function hijri(date) {
  try {
    const f = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" });
    const p = Object.fromEntries(f.formatToParts(date).map(x => [x.type, x.value]));
    return { d: +p.day, m: +p.month, y: parseInt(p.year) };
  } catch (_) { return null; }
}
const HM = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
function daysToRamadan(now) {
  for (let i = 0; i < 400; i++) { const d = new Date(now.getTime() + i * 864e5); const h = hijri(d); if (h && h.m === 9 && h.d === 1) return { days: i, h }; }
  return null;
}

/* ---------- boot ---------- */
fetch("data.json").then(r => r.json()).then(data => {
  D = data; ITEMS = data.items; ANS = data.answers;
  ITEMS.forEach(d => { byId[d.id] = d; d.n = norm(d.title + " " + d.section); d.w = new Set(words(d.title)); });
  const u = new URL(location.href);
  if (u.searchParams.get("sec") != null) { const sections = [...new Set(ITEMS.map(d => d.section))]; S.sec = sections[+u.searchParams.get("sec")] || null; }
  applyPrefs(); applyLang(); header(); today(); times(); popular(); news(); progress(); all(); fromHash();
  setInterval(tick, 1000);
}).catch(() => { $("list").innerHTML = '<div class="empty">تعذّر تحميل المواد. تأكد من الاتصال ثم أعد تحميل الصفحة.</div>'; });

function header() {
  const h = hijri(new Date());
  if (h) $("hij").textContent = `${h.d} ${HM[h.m - 1]} ${h.y} هـ`;
}

/* ---------- list ---------- */
const sectionsList = () => [...new Set(ITEMS.map(d => d.section))];
function match(d) {
  if (S.fav && !favs.has(d.id)) return false;
  if (S.sec && d.section !== S.sec) return false;
  if (S.type && d.type !== S.type) return false;
  if (S.p) { const p = PERSONA[S.p]; if (!((p.sec || []).includes(d.section) || (p.kw || []).some(k => d.n.includes(norm(k))))) return false; }
  if (S.q) return norm(S.q).split(/\s+/).filter(Boolean).every(w => d.n.includes(w));
  return true;
}
function hl(txt, q) {
  if (!q) return esc(txt);
  const ws = norm(q).split(/\s+/).filter(w => w.length > 1), nt = norm(txt);
  if (nt.length !== txt.length) return esc(txt);
  const m = new Array(txt.length).fill(false);
  ws.forEach(w => { let p = nt.indexOf(w); while (p > -1) { for (let k = p; k < p + w.length; k++) m[k] = true; p = nt.indexOf(w, p + 1); } });
  let o = ""; for (let i = 0; i < txt.length; i++) { const c = esc(txt[i]); o += m[i] && !m[i - 1] ? '<mark class="mark">' + c : c; if (m[i] && !m[i + 1]) o += "</mark>"; }
  return o;
}
function itemHTML(d) {
  const a = ANS[d.id], isNew = d.added && (Date.now() - Date.parse(d.added)) < 7 * 864e5;
  const fav = favs.has(d.id);
  const main = a
    ? `<button class="btn pri" data-act="ans" data-id="${d.id}" aria-expanded="${S.open.has(d.id)}">${ic(S.open.has(d.id) ? "up" : "ans")}${S.open.has(d.id) ? "إخفاء الجواب" : "الجواب"}</button>`
    : `<a class="btn pri" href="${esc(d.url)}" target="_blank" rel="noopener" data-act="open" data-id="${d.id}">${ic(/youtu/.test(d.url) ? "play" : "ext")}افتح</a>`;
  return `<article class="item${read.has(d.id) ? " read" : ""}" id="m-${d.id}">
    <div class="ih"><div class="ico-t">${ic(TYPE_IC[d.type] || "doc")}</div><div>
      <h3><a href="${a ? "#m-" + d.id : esc(d.url)}" ${a ? `data-act="ans" data-id="${d.id}"` : `target="_blank" rel="noopener" data-act="open" data-id="${d.id}"`}>${hl(d.title, S.q)}</a></h3>
      <div class="meta"><span class="tag">${esc(TYPE_LABEL[d.type] || d.type)}</span><span>${esc(d.section)}</span>${a ? '<span class="tag" style="background:var(--teal);color:#fff">الجواب كاملًا</span>' : ""}${isNew ? '<span class="new-b">جديد</span>' : ""}</div>
      <div class="acts">${main}
        ${a && a.audio ? `<button class="btn out" data-act="queue" data-id="${d.id}">${ic("list")}قائمة الاستماع</button>` : ""}
        <button class="btn ic" data-act="fav" data-id="${d.id}" aria-pressed="${fav}" aria-label="احفظ">${ic("mark")}</button>
        <button class="btn ic" data-act="img" data-id="${d.id}" aria-label="شارك كصورة">${ic("share")}</button>
        <button class="btn ic" data-act="copy" data-id="${d.id}" aria-label="انسخ الرابط">${ic("link")}</button>
      </div>
      ${a && S.open.has(d.id) ? panelHTML(d) : ""}
    </div></div></article>`;
}
function related(d) {
  return ITEMS.filter(x => x.id !== d.id && x.type !== "تصميم").map(x => {
    let s = 0; d.w.forEach(w => { if (x.w.has(w)) s += 2; }); if (x.section === d.section) s += 1; if (ANS[x.id]) s += .5; return [s, x];
  }).filter(r => r[0] >= 2).sort((a, b) => b[0] - a[0]).slice(0, 3).map(r => r[1]);
}
function panelHTML(d) {
  const a = ANS[d.id], rel = related(d);
  return `<div class="panel" id="p-${d.id}">
    ${a.title ? `<div class="ttl">${esc(a.title)}</div>` : ""}${a.html}
    <div id="pl-${d.id}"></div>
    <div class="prow">
      ${a.audio ? `<button class="btn pri" data-act="listen" data-id="${d.id}">${ic("vol")}استمع لجواب الشيخ</button>` : ""}
      <a class="btn" href="${esc(d.url)}" target="_blank" rel="noopener">${ic(/youtu/.test(d.url) ? "play" : "web")}${/youtu/.test(d.url) ? "يوتيوب" : "على الموقع"}</a>
      <button class="btn" data-act="img" data-id="${d.id}">${ic("img")}شاركه صورة</button>
      <button class="btn" data-act="ans" data-id="${d.id}">${ic("up")}إغلاق</button>
    </div>
    ${rel.length ? `<div class="rel block"><div class="bt">${ic("list")}فتاوى ذات صلة</div>${rel.map(x => `<a href="#m-${x.id}">${esc(x.title)}</a>`).join("")}</div>` : ""}
    <div class="ask">${ic("ask")}لم تجد ما تبحث عنه؟ <a href="${SITE_ASK}" target="_blank" rel="noopener">أرسل سؤالك للشيخ</a></div>
  </div>`;
}
function render() {
  const res = ITEMS.filter(match);
  $("count").textContent = `${res.length} مادة`;
  const designs = res.filter(d => d.type === "تصميم"), rest = res.filter(d => d.type !== "تصميم");
  let h = rest.map(itemHTML).join("");
  if (designs.length) h += `<div class="gallery">` + designs.map(d => `<a href="${esc(d.url)}" target="_blank" rel="noopener" id="m-${d.id}" data-act="open" data-id="${d.id}">${D.thumbs[d.id] ? `<img src="${D.thumbs[d.id]}" alt="${esc(d.title)}" loading="lazy">` : ""}<span>${esc(d.title)}</span></a>`).join("") + `</div>`;
  $("list").innerHTML = h || `<div class="empty">لا توجد نتائج لهذا البحث.<br><a class="btn pri" href="${SITE_ASK}" target="_blank" rel="noopener">${ic("ask")}أرسل سؤالك للشيخ</a></div>`;
}
function rail() {
  const secs = sectionsList(), cnt = s => ITEMS.filter(d => d.section === s), rp = s => { const it = cnt(s); return Math.round(100 * it.filter(d => read.has(d.id)).length / it.length); };
  $("rail").innerHTML = `<div class="bt">${ic("list")}<span>${lang === "ar" ? "أبواب الملف" : (I18N[lang].chapters)}</span></div>
    <button aria-pressed="${!S.sec}" data-s=""><span>كل الأبواب</span><small>${ITEMS.length}</small></button>` +
    secs.map(s => `<button aria-pressed="${S.sec === s}" data-s="${esc(s)}"><span>${esc(s)}</span><small>${cnt(s).length}</small><span class="rp"><i style="width:${rp(s)}%"></i></span></button>`).join("");
}
function chips() {
  const types = [...new Set(ITEMS.map(d => d.type))];
  $("types").innerHTML = `<button class="chip" aria-pressed="${!S.type}" data-t="">الكل</button>` + types.map(x => `<button class="chip" aria-pressed="${S.type === x}" data-t="${esc(x)}">${esc(TYPE_LABEL[x] || x)}</button>`).join("");
}
function all() { rail(); chips(); render(); $("favN").textContent = favs.size; }

/* ---------- events ---------- */
$("rail").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.sec = b.dataset.s || null; rail(); render(); $("rail").classList.remove("open"); scrollTo({ top: $("top").offsetTop - 110, behavior: "smooth" }); });
$("types").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.type = b.dataset.t || null; chips(); render(); });
$("railBtn").addEventListener("click", () => $("rail").classList.toggle("open"));
document.querySelector(".persona").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.p = S.p === b.dataset.p ? null : b.dataset.p; document.querySelectorAll(".persona button").forEach(x => x.setAttribute("aria-pressed", x.dataset.p === S.p)); render(); });
$("favBtn").addEventListener("click", () => { S.fav = !S.fav; $("favBtn").setAttribute("aria-pressed", S.fav); render(); if (S.fav && !favs.size) toast("لم تحفظ شيئًا بعد. اضغط علامة الحفظ بجانب أي مادة."); });

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const id = +b.dataset.id, d = byId[id], act = b.dataset.act;
  if (act === "open") { markRead(id); return; }
  e.preventDefault();
  if (act === "ans") { toggle(id); }
  else if (act === "fav") { favs.has(id) ? favs.delete(id) : favs.add(id); store.set("favs", [...favs]); b.setAttribute("aria-pressed", favs.has(id)); $("favN").textContent = favs.size; toast(favs.has(id) ? "حُفظت في المحفوظات" : "أُزيلت من المحفوظات"); if (S.fav) render(); }
  else if (act === "copy") { const u = shortUrl(d); try { await navigator.clipboard.writeText(d.title + "\n" + u); toast("تم نسخ الرابط"); } catch (_) { prompt("الرابط:", u); } }
  else if (act === "img") { shareImage(d); }
  else if (act === "listen") { listen(id); }
  else if (act === "queue") { enqueue(id, true); }
});
function toggle(id, force) {
  const open = force != null ? force : !S.open.has(id);
  open ? S.open.add(id) : S.open.delete(id);
  const el = $("m-" + id); if (!el) { render(); return; }
  el.outerHTML = itemHTML(byId[id]);
  if (open) { markRead(id); const n = $("m-" + id); if (n && force == null) n.scrollIntoView({ block: "nearest", behavior: "smooth" }); history.replaceState(null, "", "#m-" + id); }
}
function fromHash() {
  const m = location.hash.match(/^#m-(\d+)$/); if (!m || !byId[+m[1]]) return;
  const id = +m[1]; S.sec = S.type = S.p = null; S.fav = false; S.q = ""; $("q").value = ""; if (ANS[id]) S.open.add(id); all();
  const el = $("m-" + id); if (el) { el.classList.add("target"); setTimeout(() => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 110, behavior: "smooth" }), 60); markRead(id); }
}
window.addEventListener("hashchange", fromHash);

/* ---------- search + suggestions + voice ---------- */
let sel = -1;
$("q").addEventListener("input", e => { S.q = e.target.value.trim(); render(); suggest(); });
$("q").addEventListener("keydown", e => {
  const box = $("sugg"), links = [...box.querySelectorAll("a")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length; links.forEach((a, i) => a.classList.toggle("sel", i === sel)); }
  else if (e.key === "Enter") { if (sel > -1 && links[sel]) { links[sel].click(); } box.classList.remove("on"); $("top").scrollIntoView({ behavior: "smooth" }); }
  else if (e.key === "Escape") box.classList.remove("on");
});
$("q").addEventListener("blur", () => setTimeout(() => $("sugg").classList.remove("on"), 200));
function suggest() {
  const box = $("sugg"); sel = -1;
  if (S.q.length < 2) { box.classList.remove("on"); return; }
  const res = ITEMS.filter(d => d.type !== "تصميم" && match(d)).sort((a, b) => (ANS[b.id] ? 1 : 0) - (ANS[a.id] ? 1 : 0)).slice(0, 6);
  box.innerHTML = res.map(d => `<a href="#m-${d.id}" role="option">${hl(d.title, S.q)}</a>`).join("") ||
    `<a href="${SITE_ASK}" target="_blank" rel="noopener">لا نتائج. أرسل سؤالك للشيخ ←</a>`;
  box.classList.add("on");
}
$("sugg").addEventListener("click", e => { const a = e.target.closest("a"); if (a && a.hash) { $("sugg").classList.remove("on"); } });
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  $("mic").hidden = false; let rec = null;
  $("mic").addEventListener("click", () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = "ar-SA"; rec.interimResults = true; rec.maxAlternatives = 1;
    $("mic").classList.add("on");
    rec.onresult = ev => { const t = [...ev.results].map(r => r[0].transcript).join(" "); $("q").value = t; S.q = t.trim(); render(); suggest(); };
    rec.onerror = ev => { if (ev.error === "not-allowed") toast("اسمح للمتصفح باستخدام الميكروفون"); };
    rec.onend = () => { $("mic").classList.remove("on"); rec = null; };
    rec.start();
  });
}

/* ---------- prefs: text size, theme, language ---------- */
function applyPrefs() {
  document.documentElement.style.setProperty("--fs", store.get("fs", 1));
  const th = store.get("theme", null); if (th) document.documentElement.dataset.theme = th;
}
$("fsUp").addEventListener("click", () => { const v = Math.min(1.4, +(store.get("fs", 1) + .1).toFixed(2)); store.set("fs", v); applyPrefs(); });
$("fsDown").addEventListener("click", () => { const v = Math.max(.85, +(store.get("fs", 1) - .1).toFixed(2)); store.set("fs", v); applyPrefs(); });
$("theme").addEventListener("click", () => { const r = document.documentElement; const dark = r.dataset.theme === "dark"; r.dataset.theme = dark ? "light" : "dark"; store.set("theme", r.dataset.theme); });
function applyLang() {
  document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", x.dataset.l === lang));
  document.documentElement.lang = lang; document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
  document.querySelectorAll("[data-i]").forEach(el => { el.innerHTML = lang === "ar" ? AR[el.dataset.i] : ((I18N[lang] || {})[el.dataset.i] || AR[el.dataset.i]); });
}
document.querySelector(".seg").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; lang = b.dataset.l; store.set("lang", lang); applyLang(); if (ITEMS) rail(); });

/* ---------- install (PWA) ---------- */
let deferred = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("install").style.display = "inline-flex"; });
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (isIOS && !standalone) $("install").style.display = "inline-flex";
$("install").addEventListener("click", async () => {
  if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; $("install").style.display = "none"; }
  else toast("في سفاري: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»");
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

/* ---------- today's pick (by Umm al-Qura date) ---------- */
function pickBy(pred, seed) {
  let pool = ITEMS.filter(d => d.type !== "تصميم" && pred(d));
  const withAns = pool.filter(d => ANS[d.id]); if (withAns.length && seed % 3 !== 2) pool = withAns;
  return pool.length ? pool[seed % pool.length] : null;
}
function today() {
  const now = new Date(), h = hijri(now), seed = Math.floor(now.getTime() / 864e5);
  let head = "", it = null, note = "";
  const sec = s => d => d.section === s, kw = (...k) => d => k.some(x => d.n.includes(norm(x)));
  if (h && h.m === 9) {
    head = `اليوم ${h.d} من رمضان`;
    if (h.d <= 3) it = pickBy(kw("النيه", "بدخول رمضان", "تبييت"), seed);
    else if (h.d >= 27) it = pickBy(sec("زكاة الفطر"), seed);
    else if (h.d >= 20) it = pickBy(d => d.section === "العشر الأواخر من رمضان" || d.section === "أحكام الاعتكاف", seed);
    else it = pickBy(d => /الصيام|المفطرات|مفطرات|التراويح/.test(d.section), seed);
  } else if (h && h.m === 10 && h.d <= 3) { head = "عيدكم مبارك"; it = pickBy(sec("أحكام يوم العيد وسننه"), seed); }
  else if (h && h.m === 10) { head = "شوال"; it = pickBy(sec("أحكام القضاء وصيام الست من شوال"), seed); }
  else {
    const r = daysToRamadan(now);
    head = r ? `باقي ${r.days} يومًا على رمضان ${r.h.y} هـ` : "فتوى اليوم";
    it = (h && h.m === 8) ? pickBy(sec("استقبال شهر رمضان"), seed) : pickBy(d => d.type === "فتوى" || !!ANS[d.id], seed);
    note = "تتغير المادة كل يوم، وفي رمضان تتبع أيام الشهر";
  }
  if (!it) { $("today").innerHTML = ""; return; }
  $("today").innerHTML = `<div class="bt">${ic("sun")}<span>فتوى اليوم</span></div><div class="hd2">${esc(head)}</div>
    <h3>${esc(it.title)}</h3><div class="row">
    ${ANS[it.id] ? `<a class="btn pri" href="#m-${it.id}">${ic("ans")}اقرأ الجواب</a>` : `<a class="btn pri" href="${esc(it.url)}" target="_blank" rel="noopener" data-act="open" data-id="${it.id}">${ic("ext")}افتح</a>`}
    <button class="btn" data-act="img" data-id="${it.id}">${ic("share")}شاركها</button></div>${note ? `<div class="src-note">${note}</div>` : ""}`;
}

/* ---------- prayer times ---------- */
let city = store.get("city", null), loc = null, T = null;
function times() {
  const opts = CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join("");
  $("times").innerHTML = `<div class="times-head"><div class="bt" style="border:0;margin:0;padding:0">${ic("moon")}<span>مواقيت اليوم</span></div>
    <span><select id="city" aria-label="المدينة"><option value="geo">📍 موقعي</option>${opts}</select></span></div>
    <div class="cd" id="cd"></div><div class="tgrid" id="tgrid"></div>
    <div class="src-note">بطريقة حساب تقويم أم القرى (الفجر ١٨٫٥°، والعشاء بعد المغرب بـ٩٠ دقيقة و١٢٠ في رمضان). المواقيت تقريبية للاسترشاد.</div>`;
  $("city").value = city == null ? "0" : String(city);
  $("city").addEventListener("change", e => {
    if (e.target.value === "geo") {
      if (!navigator.geolocation) return toast("المتصفح لا يدعم تحديد الموقع");
      navigator.geolocation.getCurrentPosition(p => { loc = [p.coords.latitude, p.coords.longitude, Intl.DateTimeFormat().resolvedOptions().timeZone]; city = "geo"; calc(); },
        () => { toast("لم نتمكن من تحديد موقعك"); $("city").value = "0"; city = 0; store.set("city", 0); calc(); });
    } else { city = +e.target.value; store.set("city", city); calc(); }
  });
  if (city === "geo") city = 0;
  calc();
}
function calc() {
  const c = city === "geo" && loc ? ["موقعي", loc[0], loc[1], loc[2]] : CITIES[city || 0];
  const now = new Date(), h = hijri(now), ram = !!(h && h.m === 9);
  T = { c, ram, d: PrayerTimes.compute(now, c[1], c[2], c[3], ram), d2: PrayerTimes.compute(new Date(now.getTime() + 864e5), c[1], c[2], c[3], ram) };
  tick();
}
const NAMES = [["fajr", "الفجر"], ["sunrise", "الشروق"], ["dhuhr", "الظهر"], ["asr", "العصر"], ["maghrib", "المغرب"], ["isha", "العشاء"]];
function tick() {
  if (!T || !$("tgrid")) return;
  const now = new Date(), fmt = d => d.toLocaleTimeString("ar-SA-u-nu-latn", { hour: "numeric", minute: "2-digit", timeZone: T.c[3] });
  let next = NAMES.find(([k]) => T.d[k] > now), nt, nName;
  if (next) { nt = T.d[next[0]]; nName = next[1]; } else { nt = T.d2.fajr; nName = "الفجر"; next = ["fajr"]; }
  const diff = Math.max(0, nt - now), hh = Math.floor(diff / 36e5), mm = Math.floor(diff % 36e5 / 6e4), ss = Math.floor(diff % 6e4 / 1e3);
  const label = T.ram && next[0] === "maghrib" ? "على الإفطار" : T.ram && next[0] === "fajr" ? "على الإمساك (أذان الفجر)" : `على ${nName}`;
  $("cd").innerHTML = `<b>${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}</b><span>${label} · ${esc(T.c[0])}</span>`;
  const key = NAMES.map(([k]) => k + fmt(T.d[k])).join() + next[0];
  if ($("tgrid").dataset.k !== key) {
    $("tgrid").dataset.k = key;
    $("tgrid").innerHTML = NAMES.map(([k, n]) => `<div class="${k === next[0] ? "nx" : ""}"><small>${T.ram && k === "maghrib" ? "الإفطار" : n}</small><b>${fmt(T.d[k])}</b></div>`).join("");
  }
}

/* ---------- popular / new / progress ---------- */
function popular() {
  fetch("popular.json").then(r => r.json()).then(p => {
    $("popular").innerHTML = p.ids.slice(0, 5).map((id, i) => byId[id] ? `<li><a href="#m-${id}"><span class="n">${i + 1}</span><span>${esc(byId[id].title)}</span></a></li>` : "").join("");
  }).catch(() => {});
}
function news() {
  const fresh = ITEMS.filter(d => d.added).sort((a, b) => b.added.localeCompare(a.added)).slice(0, 5);
  $("news").innerHTML = fresh.map(d => `<li><a href="#m-${d.id}"><span class="new-b">جديد</span><span>${esc(d.title)}</span></a></li>`).join("") || "<li>لا جديد هذا الأسبوع</li>";
}
function progress() {
  const pool = ITEMS.filter(d => d.type !== "تصميم"), n = pool.filter(d => read.has(d.id)).length, pc = Math.round(100 * n / pool.length);
  const ans = Object.keys(ANS).length, an = Object.keys(ANS).filter(id => read.has(+id)).length;
  $("progress").innerHTML = `<div style="display:flex;justify-content:space-between;font-size:.9rem"><span>قرأت <b>${n}</b> من ${pool.length} مادة</span><b style="color:var(--teal-d)">${pc}%</b></div>
    <div class="prog"><i style="width:${pc}%"></i></div>
    <div class="src-note">الأجوبة الكاملة: ${an} من ${ans} · تقدّمك في كل باب يظهر تحت اسمه في «أبواب الملف». يُحفظ على جهازك فقط.</div>
    ${n ? `<button class="btn" id="resetRead" style="margin-top:8px">ابدأ من جديد</button>` : ""}`;
  const r = $("resetRead"); if (r) r.onclick = () => { if (confirm("مسح سجل القراءة؟")) { read.clear(); store.set("read", []); progress(); all(); } };
}

/* ---------- audio: inline player + listening queue ---------- */
function embedFor(url, auto) {
  if (/soundcloud\.com/.test(url)) return `<iframe allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%231ebcae&auto_play=${auto ? "true" : "false"}&visual=false&show_comments=false"></iframe>`;
  const g = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (g) return `<iframe allow="autoplay" src="https://drive.google.com/file/d/${g[1]}/preview"></iframe>`;
  if (/\.(mp3|m4a|ogg|wav)(\?|$)/i.test(url)) return `<audio controls ${auto ? "autoplay" : ""} src="${esc(url)}" style="width:100%"></audio>`;
  return `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">افتح المقطع الصوتي</a>`;
}
function listen(id) {
  const a = ANS[id], box = $("pl-" + id); if (!box) return;
  box.innerHTML = `<div class="player">${embedFor(a.audio, true)}</div>`; markRead(id);
}
let Q = store.get("queue", []), qi = 0;
function enqueue(id, play) {
  if (!Q.includes(id)) Q.push(id); store.set("queue", Q);
  if (play && !$("queue").classList.contains("on")) { qi = Q.indexOf(id); playQ(); } else toast(`أُضيفت لقائمة الاستماع (${Q.length})`);
}
function playQ() {
  const id = Q[qi], d = byId[id], a = ANS[id]; if (!a) return;
  $("queue").classList.add("on"); document.body.classList.add("qpad");
  $("qTitle").innerHTML = `${esc(d.title)}<small>قائمة الاستماع ${qi + 1} من ${Q.length}${/soundcloud|\.mp3/.test(a.audio) ? " · تنتقل تلقائيًا للتالي" : ""}</small>`;
  $("qFrame").innerHTML = embedFor(a.audio, true); markRead(id);
  const au = $("qFrame").querySelector("audio"); if (au) au.onended = () => next();
  const fr = $("qFrame").querySelector("iframe");
  if (fr && /soundcloud/.test(fr.src)) loadSC().then(() => { const w = SC.Widget(fr); w.bind(SC.Widget.Events.FINISH, () => next()); }).catch(() => {});
}
function next() { if (qi < Q.length - 1) { qi++; playQ(); } }
let scP = null;
const loadSC = () => scP || (scP = new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://w.soundcloud.com/player/api.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
$("qNext").onclick = next;
$("qPrev").onclick = () => { if (qi > 0) { qi--; playQ(); } };
$("qClose").onclick = () => { $("queue").classList.remove("on"); document.body.classList.remove("qpad"); $("qFrame").innerHTML = ""; Q = []; store.set("queue", Q); };

/* ---------- share as image ---------- */
const imgCache = {};
const loadImg = src => imgCache[src] || (imgCache[src] = new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }));
function wrap(ctx, text, maxW) {
  const out = []; let line = "";
  text.split(/\s+/).forEach(w => { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
  if (line) out.push(line); return out;
}
function drawQR(ctx, text, x, y, size) {
  const q = new QRCode(-1, QRLevel.M); q.addData(text); q.make();
  const n = q.getModuleCount(), cell = size / (n + 2);
  ctx.fillStyle = "#fff"; ctx.fillRect(x, y, size, size); ctx.fillStyle = "#182d58";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + (c + 1) * cell, y + (r + 1) * cell, Math.ceil(cell), Math.ceil(cell));
}
let shareBlob = null, shareD = null;
async function shareImage(d) {
  await document.fonts.load("700 40px Expo"); await document.fonts.load("500 40px Readex"); await document.fonts.load("300 40px Readex");
  const cv = $("shareCv"), ctx = cv.getContext("2d"), W = 1080, H = 1350, a = ANS[d.id];
  ctx.direction = "rtl"; ctx.textAlign = "right";
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, "#1ebcae"); g.addColorStop(1, "#4b75a3");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 230);
  try { const s = await loadImg("img/sheikh-white.png"); const h = 150, w = h * s.width / s.height; ctx.drawImage(s, W - 60 - w, 40, w, h); } catch (_) {}
  try { const m = await loadImg("img/logo-white.png"); const h = 150, w = h * m.width / m.height; ctx.drawImage(m, 60, 40, w, h); } catch (_) {}
  ctx.fillStyle = "#182d58"; ctx.font = "700 46px Expo, Readex, sans-serif"; ctx.fillText("الملف الرمضاني التفاعلي", W - 70, 310);
  ctx.fillStyle = "#1ebcae"; ctx.fillRect(W - 70 - 160, 332, 160, 6);
  ctx.font = "500 50px Readex, sans-serif"; ctx.fillStyle = "#182d58";
  let y = 430; wrap(ctx, d.title, W - 140).slice(0, 4).forEach(l => { ctx.fillText(l, W - 70, y); y += 74; });
  y += 10;
  const body = a ? a.text : `${TYPE_LABEL[d.type] || d.type} · ${d.section}`;
  ctx.font = "300 36px Readex, sans-serif"; ctx.fillStyle = "#18181b";
  const lines = wrap(ctx, body, W - 170), maxL = Math.floor((1080 - y) / 58);
  const show = lines.slice(0, maxL); if (lines.length > maxL) show[show.length - 1] += " …";
  ctx.fillStyle = "rgba(210,242,239,.55)"; ctx.fillRect(70, y - 20, W - 140, show.length * 58 + 30);
  ctx.fillStyle = "#1ebcae"; ctx.fillRect(W - 76, y - 20, 6, show.length * 58 + 30);
  ctx.fillStyle = "#18181b"; show.forEach(l => { y += 58; ctx.fillText(l, W - 100, y - 16); });
  ctx.fillStyle = "#4d525e"; ctx.fillRect(0, H - 200, W, 200);
  drawQR(ctx, shortUrl(d), 60, H - 180, 160);
  ctx.fillStyle = "#fff"; ctx.font = "500 34px Readex, sans-serif"; ctx.fillText(a ? "اقرأ الجواب كاملًا واستمع لصوت الشيخ" : "افتح المادة كاملة", W - 70, H - 115);
  ctx.font = "300 26px Readex, sans-serif"; ctx.direction = "ltr"; ctx.textAlign = "right"; ctx.fillText(shortUrl(d).replace(/^https?:\/\//, ""), W - 70, H - 65);
  shareD = d; shareBlob = await new Promise(r => cv.toBlob(r, "image/png"));
  $("shareDlg").showModal();
}
$("shareX").onclick = () => $("shareDlg").close();
$("shareDl").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(shareBlob); a.download = "fatwa-" + shareD.slug + ".png"; a.click(); };
$("shareGo").onclick = async () => {
  const f = new File([shareBlob], "fatwa-" + shareD.slug + ".png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: shareD.title + "\n" + shortUrl(shareD) }); } catch (_) {} }
  else { $("shareDl").click(); toast("حُفظت الصورة، أرسلها من معرض الصور"); }
};
})();
