import { getApps } from "./api.js";

let apps = [];
let cat = "All";
let activeTab = "home";
let toastTimer = null;

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const hue = (n) => {
  let h = 0;
  for (const c of String(n || "")) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

const bg = (a) => {
  const h = hue(a.name);
  return `linear-gradient(135deg, hsl(${h}, 68%, 48%), hsl(${(h + 55) % 360}, 72%, 34%))`;
};

const icon = (a) => {
  const ch = (String(a.name || "A").trim()[0] || "A").toUpperCase();
  return a.icon_url
    ? `<img class="ic" src="${esc(a.icon_url)}" alt="${esc(a.name || "")}">`
    : `<div class="ic" style="background:${bg(a)}">${esc(ch)}</div>`;
};

function getInstalledMap() {
  try {
    return JSON.parse(localStorage.getItem("appnest_installed") || "{}");
  } catch (_) {
    return {};
  }
}

function markInstalled(app) {
  const map = getInstalledMap();
  map[String(app.id)] = {
    version: String(app.version || "1.0"),
    installedAt: Date.now()
  };
  localStorage.setItem("appnest_installed", JSON.stringify(map));
}

function actionLabel(app) {
  const inst = getInstalledMap()[String(app.id)];
  if (!inst) return "Install";
  const curVer = String(app.version || "1.0");
  return inst.version !== curVer ? `Update (${curVer})` : "Reinstall";
}

function toast(m) {
  const t = $("#t");
  t.textContent = m;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 3200);
}

function setActiveTabUI(tab) {
  activeTab = tab;
  document.querySelectorAll(".nav-tab, .bnav-btn").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
}

function card(a) {
  return `
    <div class="store-card" data-open-app="${esc(a.id)}">
      ${icon(a)}
      <b>${esc(a.name)}</b>
      <div class="meta-row">
        <span>${esc(a.category || "App")}</span>
        <span>${esc(a.rating || "New")} ★</span>
      </div>
    </div>
  `;
}

function listRow(a) {
  return `
    <div class="app-row" data-open-app="${esc(a.id)}">
      ${icon(a)}
      <div class="app-row-info">
        <b>${esc(a.name)}</b>
        <small>${esc(a.developer || "Developer")} · ${esc(a.category || "General")}</small>
        <small>v${esc(a.version || "1.0")} · ${esc(a.size || "APK")} · ${esc(a.downloads || "—")}</small>
      </div>
      <span class="pill-badge">${esc(actionLabel(a))}</span>
    </div>
  `;
}

function filterByTabAndSearch(source) {
  const q = ($("#q")?.value || "").trim().toLowerCase();
  return source.filter((a) => {
    const c = String(a.category || "").toLowerCase();
    if (activeTab === "games" && !/game|arcade|puzzle|action|racing/i.test(c)) return false;
    if (activeTab === "apps" && /game|arcade|puzzle|action|racing/i.test(c)) return false;
    if (cat !== "All" && a.category !== cat) return false;
    if (!q) return true;
    const hay = `${a.name || ""} ${a.developer || ""} ${a.category || ""} ${a.tagline || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function home() {
  const q = ($("#q")?.value || "").trim();
  const cats = ["All", ...new Set(apps.map((a) => a.category).filter(Boolean))];
  const filtered = filterByTabAndSearch(apps);
  const featured = apps.find((a) => /^true$/i.test(a.featured)) || apps[0];

  let html = "";

  if (!q && activeTab === "home" && cat === "All" && featured) {
    html += `
      <section class="featured-card" data-open-app="${esc(featured.id)}">
        ${icon(featured)}
        <div class="featured-meta">
          <div class="kicker">★ Featured Release · v${esc(featured.version || "1.0")}</div>
          <h1>${esc(featured.name)}</h1>
          <div class="dev">${esc(featured.developer || "Independent Release")} · ${esc(featured.size || "APK")}</div>
          <p class="tag-line">${esc(featured.tagline || (featured.description || "").slice(0, 140))}</p>
        </div>
        <button class="btn" data-open-app="${esc(featured.id)}">View Release</button>
      </section>
    `;
  }

  html += `
    <div class="pills">
      ${cats.map((c) => `<button class="pill ${c === cat ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
    </div>
  `;

  if (!filtered.length) {
    return html + `<div class="empty">No matching release APKs found.</div>`;
  }

  if (q) {
    return (
      html +
      `<div class="sec-head"><h2>Search Results</h2><span class="sec-sub">${filtered.length} found</span></div>
       <div class="list-grid">${filtered.map(listRow).join("")}</div>`
    );
  }

  if (activeTab === "home" && cat === "All") {
    const trending = [...filtered]
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      .slice(0, 10);
    const recent = [...filtered].reverse().slice(0, 10);

    html += `
      <div class="sec-head"><h2>Trending</h2><span class="sec-sub">Top rated releases</span></div>
      <div class="h-scroll">${trending.map(card).join("")}</div>
      <div class="sec-head"><h2>Recently Updated</h2><span class="sec-sub">Latest builds</span></div>
      <div class="h-scroll">${recent.map(card).join("")}</div>
      <div class="sec-head"><h2>All Releases</h2><span class="sec-sub">${filtered.length} available</span></div>
      <div class="list-grid">${filtered.map(listRow).join("")}</div>
    `;
    return html;
  }

  return (
    html +
    `<div class="sec-head"><h2>${esc(cat === "All" ? activeTab.toUpperCase() : cat)}</h2><span class="sec-sub">${filtered.length} items</span></div>
     <div class="list-grid">${filtered.map(listRow).join("")}</div>`
  );
}

function updatesView() {
  const inst = getInstalledMap();
  const installedApps = apps.filter((a) => Boolean(inst[String(a.id)]));

  if (!installedApps.length) {
    return `
      <div class="sec-head"><h2>Tracked & Updates</h2><span class="sec-sub">No apps installed from this store yet</span></div>
      <div class="empty">Install an app from Home, Apps, or Games to track its version and updates here.</div>
    `;
  }

  return `
    <div class="sec-head"><h2>Installed & Updates</h2><span class="sec-sub">${installedApps.length} tracked</span></div>
    <div class="list-grid">${installedApps.map(listRow).join("")}</div>
  `;
}

function detail(id) {
  const a = apps.find((x) => String(x.id) === String(id));
  if (!a) return `<div class="empty">App not found</div>`;

  const shots = String(a.screenshots || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return `
    <button class="back-btn" data-back-home>← Back</button>

    <section class="detail-hero">
      ${icon(a)}
      <div class="detail-main">
        <h1>${esc(a.name)}</h1>
        <div class="detail-dev">${esc(a.developer || "Developer")}</div>
        <p class="detail-tagline">${esc(a.tagline || "")}</p>
        <div class="detail-actions">
          <button class="btn" id="dl" data-id="${esc(a.id)}">⬇ ${esc(actionLabel(a))}</button>
          ${
            a.download_url && a.download_url !== "#"
              ? `<a class="btn ghost" href="${esc(a.download_url)}" target="_blank" rel="noopener noreferrer">Direct Link</a>`
              : ""
          }
        </div>
      </div>
    </section>

    <div class="stats-strip">
      <div class="stat-box"><b>${esc(a.rating || "New")} ★</b><span>Rating</span></div>
      <div class="stat-box"><b>${esc(a.downloads || "—")}</b><span>Downloads</span></div>
      <div class="stat-box"><b>${esc(a.size || "—")}</b><span>Size</span></div>
      <div class="stat-box"><b>v${esc(a.version || "1.0")}</b><span>Latest Release</span></div>
      <div class="stat-box"><b>${esc(a.category || "App")}</b><span>Category</span></div>
    </div>

    ${
      shots.length
        ? `<div class="sec-head"><h2>Screenshots</h2><span class="sec-sub">${shots.length} previews</span></div>
           <div class="shots">${shots.map((s) => `<img src="${esc(s)}" alt="${esc(a.name || "Screenshot")}">`).join("")}</div>`
        : ""
    }

    <div class="sec-head"><h2>About this app</h2><span class="sec-sub">Release details</span></div>
    <div class="info-card">${esc(a.description || "No description provided.")}</div>

    <div class="sec-head"><h2>More like this</h2></div>
    <div class="h-scroll">${apps.filter((x) => String(x.id) !== String(id)).slice(0, 8).map(card).join("")}</div>
  `;
}

function route() {
  const hash = location.hash.slice(1);
  if (hash.startsWith("app-")) {
    $("#app").innerHTML = detail(decodeURIComponent(hash.slice(4)));
  } else {
    $("#app").innerHTML = activeTab === "updates" ? updatesView() : home();
  }
  window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const tabBtn = e.target.closest("[data-tab]");
  if (tabBtn) {
    setActiveTabUI(tabBtn.dataset.tab);
    cat = "All";
    if (location.hash) location.hash = "";
    else route();
    return;
  }

  if (e.target.closest("[data-back-home]")) {
    location.hash = "";
    return;
  }

  const openEl = e.target.closest("[data-open-app]");
  if (openEl) {
    location.hash = `app-${encodeURIComponent(String(openEl.dataset.openApp))}`;
    return;
  }

  const pill = e.target.closest(".pill");
  if (pill) {
    cat = pill.dataset.cat;
    route();
    return;
  }

  const dlBtn = e.target.closest("#dl");
  if (dlBtn) {
    const a = apps.find((x) => String(x.id) === String(dlBtn.dataset.id));
    if (!a || !a.download_url || a.download_url === "#") {
      return toast("Add a valid direct APK download_url in Admin Panel");
    }
    markInstalled(a);
    const link = document.createElement("a");
    link.href = a.download_url;
    link.download = "";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast(`Downloading ${a.name} (v${a.version || "1.0"})...`);
    route();
  }
});

$("#q").oninput = () => {
  if (location.hash) location.hash = "";
  else route();
};

window.addEventListener("hashchange", route);

getApps().then((data) => {
  apps = Array.isArray(data) ? data : [];
  route();
});