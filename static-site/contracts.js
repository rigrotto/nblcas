// ============================================================
// NBLCAS Contracts Page – Plain JS
// ============================================================

const NBL_TEAMS = [
  { name: "Adelaide 36ers",       short: "Adelaide",     gid: "1980844410", logo: "https://www.nblstore.com.au/cdn/shop/files/ADL.svg?v=1764817092&width=400" },
  { name: "Brisbane Bullets",     short: "Brisbane",     gid: "1313059740", logo: "https://www.nblstore.com.au/cdn/shop/files/BBT.svg?v=1764817133&width=400" },
  { name: "Cairns Taipans",       short: "Cairns",       gid: "365176381",  logo: "https://www.nblstore.com.au/cdn/shop/files/CNS.svg?v=1764821148&width=400" },
  { name: "Illawarra Hawks",      short: "Illawarra",    gid: "447546404",  logo: "https://www.nblstore.com.au/cdn/shop/files/IHK.svg?v=1764821156&width=400" },
  { name: "Melbourne United",     short: "Melbourne",    gid: "1070766894", logo: "https://www.nblstore.com.au/cdn/shop/files/MUD.svg?v=1764821156&width=400" },
  { name: "NZ Breakers",          short: "New Zealand",  gid: "1357324412", logo: "https://www.nblstore.com.au/cdn/shop/files/NZB.svg?v=1764821156&width=400" },
  { name: "Perth Wildcats",       short: "Perth",        gid: "1954342135", logo: "https://www.nblstore.com.au/cdn/shop/files/PWK.svg?v=1764821156&width=400" },
  { name: "SE Melbourne Phoenix", short: "SE Melbourne", gid: "2011473787", logo: "https://www.nblstore.com.au/cdn/shop/files/SEM.svg?v=1764821156&width=400" },
  { name: "Sydney Kings",         short: "Sydney",       gid: "953523587",  logo: "https://www.nblstore.com.au/cdn/shop/files/SYK.svg?v=1764821156&width=400" },
  { name: "Tasmania JackJumpers", short: "Tasmania",     gid: "240611479",  logo: "https://www.nblstore.com.au/cdn/shop/files/TJJ.svg?v=1764821156&width=400" },
];

const SHEET_BASE      = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFBKSjF0LkWHgCcIJ7maLvmAqsb-HeQLvOE4-qwj1QU6BLf2_PWpczhzyMgBnxiHbk9BkGnWeQu0io/pub?output=csv";
const CURRENT_SEASONS = ["2024-25", "2025-26", "2026-27", "2027-28"];

// ── State ──────────────────────────────────────────────────
let activeTeamIdx  = 0;
let isLoading      = false;
let errorMsg       = null;
let search         = "";
let statusFilter   = "All";
let sort           = { col: "", dir: null };
let showFilters    = false;
let selectedPlayer = null;
let modalTeam      = null;   // team for the currently open modal
let globalMode     = false;  // all-teams search active
let globalLoading  = false;  // loading all teams
const cache        = {};     // gid → { players, seasonLabels, loadedAt }

// ── DOM shortcuts ──────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = {
  teamTabs:    $("team-tabs"),
  updatedTime: $("updated-time"),
  refreshBtn:  $("refresh-btn"),
  refreshIcon: $("refresh-icon"),
  refreshLbl:  $("refresh-label"),
  teamInfo:    $("team-info"),
  searchInput: $("search-input"),
  filterBtn:   $("filter-btn"),
  filterDot:   $("filter-dot"),
  clearBtn:    $("clear-btn"),
  globalBtn:   $("global-btn"),
  filterPanel: $("filter-panel"),
  statusSel:   $("status-select"),
  globalBox:   $("global-box"),
  errorBox:    $("error-box"),
  errorText:   $("error-text"),
  errorRetry:  $("error-retry"),
  loadingBox:  $("loading-box"),
  tableBox:    $("table-box"),
  tableHead:   $("table-head"),
  tableBody:   $("table-body"),
  tableCount:  $("table-count"),
  exportBtn:   $("export-btn"),
  legendBox:   $("legend-box"),
  modal:       $("modal"),
  modalBdrop:  $("modal-backdrop"),
  modalName:   $("modal-name"),
  modalMeta:   $("modal-meta"),
  modalBody:   $("modal-body"),
  modalClose:  $("modal-close"),
};

// ── Helpers ────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function parseCSV(csv) {
  const rows = [];
  let row = [], inQ = false, cur = "";
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQ && csv[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      row.push(cur.trim()); cur = "";
    } else if ((ch === "\n" || ch === "\r") && !inQ) {
      if (ch === "\r" && csv[i+1] === "\n") i++;
      row.push(cur.trim()); rows.push(row); row = []; cur = "";
    } else { cur += ch; }
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}

function badgeClass(status) {
  if (!status) return "badge-default";
  const l = status.toLowerCase();
  if (l === "local" || l.startsWith("local")) return "badge-local";
  if (l === "import")                          return "badge-import";
  if (l.includes("next star"))                 return "badge-next";
  if (l.includes("srp"))                       return "badge-srp";
  return "badge-default";
}

function dotClass(team, detail) {
  const l = (team + " " + detail).toLowerCase();
  if (l.includes("fa") || l.includes("free agent") || l.includes("ufa") || l.includes("rfa")) return "dot-amber";
  if (l.includes("opt")) return "dot-blue";
  if (!team && detail)   return "dot-muted";
  return "dot-green";
}

function contractCellHTML(team, detail) {
  if (!team && !detail) return `<span class="dash">—</span>`;
  const dc = dotClass(team, detail);
  let h = `<div class="contract-cell">`;
  if (team)   h += `<span class="contract-team"><span class="dot ${dc}"></span>${esc(team)}</span>`;
  if (detail) h += `<span class="contract-detail">${esc(detail)}</span>`;
  return h + `</div>`;
}

function sortIconSVG(col) {
  if (sort.col !== col)
    return `<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" opacity="0.3"><polyline points="18 15 12 9 6 15"/></svg>`;
  const poly = sort.dir === "asc" ? "18 15 12 9 6 15" : "6 9 12 15 18 9";
  return `<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:var(--primary)"><polyline points="${poly}"/></svg>`;
}

// ── Position breakdown (feature 5) ────────────────────────
function posBreakdownHTML(players) {
  if (!players.length) return "";
  const counts = {};
  players.forEach(p => {
    const pos = p.position?.trim();
    if (pos) counts[pos] = (counts[pos] ?? 0) + 1;
  });
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([pos, n]) => `<span class="pos-chip">${n} ${esc(pos)}</span>`)
    .join("");
  return parts ? `<div class="pos-row">${parts}</div>` : "";
}

// ── Data loading ───────────────────────────────────────────
async function loadTeam(gid, force = false) {
  if (!force && cache[gid]) return;

  isLoading = true;
  errorMsg  = null;
  renderState();

  try {
    const res = await fetch(`${SHEET_BASE}&gid=${gid}`, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv     = await res.text();
    const allRows = parseCSV(csv).filter(r => r.some(c => c !== ""));

    if (allRows.length < 2) {
      cache[gid] = { players: [], seasonLabels: CURRENT_SEASONS, loadedAt: new Date() };
    } else {
      const headers      = allRows[0];
      const colToSeason  = {};
      headers.forEach((h, i) => {
        const c = h.trim();
        if (/\d{4}-\d{2}/.test(c)) colToSeason[i] = c;
      });
      const seasonLabels = CURRENT_SEASONS.filter(s => Object.values(colToSeason).includes(s));

      const dataRows        = allRows.slice(1);
      const uncontractedIdx = dataRows.findIndex(r => r.some(c => c.toLowerCase().includes("uncontracted")));
      const rows            = uncontractedIdx >= 0 ? dataRows.slice(0, uncontractedIdx) : dataRows;

      const players = [];
      let i = 0;
      while (i < rows.length) {
        const teamRow   = rows[i];
        const detailRow = (i+1 < rows.length && !rows[i+1][0]?.trim()) ? rows[i+1] : null;
        const name      = teamRow[0]?.trim() ?? "";
        if (!name) { i++; continue; }

        const status   = teamRow[1]?.trim() ?? "";
        const position = teamRow[2]?.trim() ?? "";
        const seasons  = {};
        Object.entries(colToSeason).forEach(([idxStr, label]) => {
          const idx = Number(idxStr);
          seasons[label] = {
            team:   teamRow[idx]?.trim()    ?? "",
            detail: detailRow?.[idx]?.trim() ?? "",
          };
        });
        players.push({ name, status, position, seasons });
        i += detailRow ? 2 : 1;
      }

      const contracted = players.filter(p =>
        CURRENT_SEASONS.some(s => {
          const se = p.seasons[s];
          return se && (se.team.trim() !== "" || se.detail.trim() !== "");
        })
      );
      cache[gid] = { players: contracted, seasonLabels, loadedAt: new Date() };
    }
  } catch (err) {
    errorMsg = "Failed to load roster data. Check your connection and try again.";
  }

  isLoading = false;
  renderState();
}

// ── Load all teams (global search) ────────────────────────
async function loadAllTeams() {
  globalLoading = true;
  renderGlobalBox();
  await Promise.all(NBL_TEAMS.map(t => loadTeam(t.gid)));
  globalLoading = false;
  renderGlobalBox();
}

// ── Derived state ──────────────────────────────────────────
function activeTeam()  { return NBL_TEAMS[activeTeamIdx]; }
function getCached()   { return cache[activeTeam().gid]; }

function getFiltered() {
  const c = getCached();
  if (!c) return [];
  let rows = [...c.players];

  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter(p =>
      p.name.toLowerCase().includes(q)     ||
      p.status.toLowerCase().includes(q)   ||
      p.position.toLowerCase().includes(q) ||
      Object.values(p.seasons).some(s =>
        s.team.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
      )
    );
  }

  if (statusFilter !== "All") rows = rows.filter(p => p.status === statusFilter);

  if (sort.col && sort.dir) {
    rows.sort((a, b) => {
      let av = "", bv = "";
      if      (sort.col === "name")     { av = a.name;     bv = b.name;     }
      else if (sort.col === "position") { av = a.position; bv = b.position; }
      else if (sort.col === "status")   { av = a.status;   bv = b.status;   }
      else { av = a.seasons[sort.col]?.team ?? ""; bv = b.seasons[sort.col]?.team ?? ""; }
      const cmp = av.toLowerCase().localeCompare(bv.toLowerCase());
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }
  return rows;
}

// Returns [{player, team}] across all cached teams matching the search
function getGlobalFiltered() {
  if (!search.trim()) return [];
  const q = search.toLowerCase();
  const results = [];
  for (const team of NBL_TEAMS) {
    const c = cache[team.gid];
    if (!c) continue;
    c.players.forEach(p => {
      if (
        p.name.toLowerCase().includes(q)     ||
        p.status.toLowerCase().includes(q)   ||
        p.position.toLowerCase().includes(q) ||
        Object.values(p.seasons).some(s =>
          s.team.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
        )
      ) results.push({ player: p, team });
    });
  }
  return results;
}

// ── Render: tabs ───────────────────────────────────────────
function renderTabs() {
  el.teamTabs.innerHTML = NBL_TEAMS.map((t, idx) => {
    const active   = idx === activeTeamIdx;
    const isCached = !!cache[t.gid];
    return `<button class="team-tab${active ? " active" : ""}" data-idx="${idx}">
      <img src="${esc(t.logo)}" alt="${esc(t.short)}" loading="lazy">
      <span>${esc(t.short)}</span>
      ${isCached && !active ? `<span class="cached-dot"></span>` : ""}
    </button>`;
  }).join("");

  el.teamTabs.querySelectorAll(".team-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      if (globalMode) {
        globalMode = false;
        el.globalBtn.className = "btn btn-secondary";
      }
      if (idx === activeTeamIdx && !globalMode) return;
      activeTeamIdx = idx;
      search        = "";
      statusFilter  = "All";
      sort          = { col: "", dir: null };
      el.searchInput.value = "";
      renderTabs();
      loadTeam(NBL_TEAMS[idx].gid).then(() => renderTabs());
    });
  });
}

// ── Render: team info (with position breakdown) ────────────
function renderTeamInfo() {
  const team   = activeTeam();
  const cached = getCached();
  let countHtml = "";
  if (!isLoading && cached) {
    const counts = {};
    cached.players.forEach(p => { const s = p.status || "Other"; counts[s] = (counts[s] ?? 0) + 1; });
    const parts = Object.entries(counts).map(([k, v]) => `${v} ${esc(k)}`).join(", ");
    countHtml = `<span class="team-count-text">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ${cached.players.length} contracted player${cached.players.length !== 1 ? "s" : ""}
      ${parts ? `<span class="count-aside">— ${parts}</span>` : ""}
    </span>
    ${posBreakdownHTML(cached.players)}`;
  }
  el.teamInfo.innerHTML = `
    <div class="team-info-left">
      <img src="${esc(team.logo)}" alt="${esc(team.short)}" class="team-big-logo">
      <div>
        <div class="team-name-text">${esc(team.name)}</div>
        ${countHtml}
      </div>
    </div>`;
}

// ── Render: search controls ────────────────────────────────
function renderSearchControls() {
  const hasFilters = search.trim() !== "" || statusFilter !== "All";
  el.filterBtn.className = `btn btn-filter${showFilters ? " on" : ""}`;
  el.globalBtn.className = `btn ${globalMode ? "btn-filter on" : "btn-secondary"}`;
  el.filterDot.classList.toggle("hidden", !hasFilters);
  el.clearBtn.classList.toggle("hidden", !hasFilters);

  // Hide per-team filter panel in global mode
  el.filterPanel.classList.toggle("hidden", !showFilters || globalMode);

  const cached = getCached();
  if (cached) {
    const opts = ["All", ...Array.from(new Set(cached.players.map(p => p.status).filter(Boolean))).sort()];
    el.statusSel.innerHTML = opts.map(t =>
      `<option value="${esc(t)}"${t === statusFilter ? " selected" : ""}>${esc(t)}</option>`
    ).join("");
  }
}

// ── Render: global search box (feature 2) ─────────────────
function renderGlobalBox() {
  if (!globalMode) {
    el.globalBox.classList.add("hidden");
    return;
  }
  el.globalBox.classList.remove("hidden");

  if (globalLoading) {
    el.globalBox.innerHTML = `
      <div class="global-loading">
        <svg class="spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Loading all teams…
      </div>`;
    return;
  }

  const teamsLoaded = NBL_TEAMS.filter(t => cache[t.gid]).length;
  const results     = getGlobalFiltered();

  if (teamsLoaded < NBL_TEAMS.length) {
    el.globalBox.innerHTML = `
      <div class="global-loading">
        <svg class="spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Loading teams… (${teamsLoaded}/${NBL_TEAMS.length})
      </div>`;
    return;
  }

  if (!search.trim()) {
    el.globalBox.innerHTML = `<div class="global-prompt">Type in the search box to find a player across all 10 teams.</div>`;
    return;
  }

  if (results.length === 0) {
    el.globalBox.innerHTML = `<div class="global-prompt">No players found matching "<strong>${esc(search)}</strong>" across any team.</div>`;
    return;
  }

  const seasonLabels = CURRENT_SEASONS;
  el.globalBox.innerHTML = `
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th><span class="th-inner">Player</span></th>
              <th><span class="th-inner">Team</span></th>
              <th><span class="th-inner">Type</span></th>
              <th><span class="th-inner">Pos</span></th>
              ${seasonLabels.map(s => `<th><span class="th-inner">${esc(s)}</span></th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${results.map(({ player: p, team }, i) => `
              <tr class="player-row">
                <td><button class="player-name-btn" data-gidx="${i}">${esc(p.name)}</button></td>
                <td>
                  <span style="display:inline-flex;align-items:center;gap:0.375rem;font-size:0.8125rem;">
                    <img src="${esc(team.logo)}" alt="${esc(team.short)}" style="width:1.25rem;height:1.25rem;object-fit:contain;opacity:0.85;">
                    ${esc(team.short)}
                  </span>
                </td>
                <td>${p.status ? `<span class="badge ${badgeClass(p.status)}">${esc(p.status)}</span>` : ""}</td>
                <td class="td-pos">${esc(p.position) || "—"}</td>
                ${seasonLabels.map(label =>
                  `<td>${contractCellHTML(p.seasons[label]?.team ?? "", p.seasons[label]?.detail ?? "")}</td>`
                ).join("")}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="table-count"><strong>${results.length}</strong> player${results.length !== 1 ? "s" : ""} across all teams</span>
      </div>
    </div>`;

  el.globalBox.querySelectorAll(".player-name-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const { player, team } = results[parseInt(btn.dataset.gidx, 10)];
      openModal(player, team);
    });
  });
}

// ── Render: per-team table ─────────────────────────────────
function renderTable() {
  const cached   = getCached();
  if (!cached) return;
  const { seasonLabels } = cached;
  const filtered = getFiltered();

  const cols = [
    { key: "name",     label: "Player" },
    { key: "status",   label: "Type"   },
    { key: "position", label: "Pos"    },
    ...seasonLabels.map(s => ({ key: s, label: s })),
  ];

  el.tableHead.innerHTML = `<tr>${cols.map(({ key, label }) =>
    `<th data-col="${esc(key)}"><span class="th-inner">${esc(label)} ${sortIconSVG(key)}</span></th>`
  ).join("")}</tr>`;

  el.tableHead.querySelectorAll("th").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      if (sort.col !== col)        sort = { col, dir: "asc" };
      else if (sort.dir === "asc") sort = { col, dir: "desc" };
      else                         sort = { col: "",  dir: null };
      renderTable();
    });
  });

  if (filtered.length === 0) {
    el.tableBody.innerHTML = `<tr><td colspan="${cols.length}" class="no-results">No contracted players match your search.</td></tr>`;
  } else {
    el.tableBody.innerHTML = filtered.map((p, i) => `
      <tr class="player-row">
        <td><button class="player-name-btn" data-idx="${i}">${esc(p.name)}</button></td>
        <td>${p.status ? `<span class="badge ${badgeClass(p.status)}">${esc(p.status)}</span>` : ""}</td>
        <td class="td-pos">${esc(p.position) || "—"}</td>
        ${seasonLabels.map(label =>
          `<td>${contractCellHTML(p.seasons[label]?.team ?? "", p.seasons[label]?.detail ?? "")}</td>`
        ).join("")}
      </tr>`).join("");

    el.tableBody.querySelectorAll(".player-name-btn").forEach(btn => {
      btn.addEventListener("click", () => openModal(filtered[parseInt(btn.dataset.idx, 10)], activeTeam()));
    });
  }

  el.tableCount.innerHTML =
    `Showing <strong>${filtered.length}</strong> of <strong>${cached.players.length}</strong> contracted players`;
}

// ── Render: all state ──────────────────────────────────────
function renderState() {
  const cached = getCached();

  el.refreshBtn.disabled = isLoading;
  el.refreshIcon.setAttribute("class", isLoading ? "spin" : "");
  el.refreshLbl.textContent = isLoading ? "Loading…" : "Refresh";

  if (cached?.loadedAt) {
    el.updatedTime.textContent = `Updated ${cached.loadedAt.toLocaleTimeString()}`;
  }

  renderTeamInfo();
  renderSearchControls();

  // Error
  if (errorMsg) {
    el.errorText.textContent = errorMsg;
    el.errorBox.classList.remove("hidden");
  } else {
    el.errorBox.classList.add("hidden");
  }

  if (globalMode) {
    // In global mode: hide per-team UI, show global box
    el.loadingBox.classList.add("hidden");
    el.tableBox.classList.add("hidden");
    el.legendBox.classList.add("hidden");
    renderGlobalBox();
  } else {
    el.globalBox.classList.add("hidden");
    el.loadingBox.classList.toggle("hidden", !isLoading);
    if (!isLoading && cached) {
      el.tableBox.classList.remove("hidden");
      el.legendBox.classList.remove("hidden");
      renderTable();
    } else {
      el.tableBox.classList.add("hidden");
      el.legendBox.classList.add("hidden");
    }
  }
}

// ── Export CSV (feature 4) ─────────────────────────────────
function exportCSV() {
  let rows, filename, extraCol = false;

  if (globalMode) {
    const results = getGlobalFiltered();
    if (!results.length) return;
    extraCol = true;
    const hdr  = ["Player", "Team", "Type", "Position", ...CURRENT_SEASONS];
    const data  = results.map(({ player: p, team }) => [
      p.name, team.name, p.status, p.position,
      ...CURRENT_SEASONS.map(s => {
        const se = p.seasons[s];
        return [se?.team, se?.detail].filter(Boolean).join(" – ");
      }),
    ]);
    rows     = [hdr, ...data];
    filename = "nblcas-all-teams.csv";
  } else {
    const cached = getCached();
    if (!cached) return;
    const filtered = getFiltered();
    const { seasonLabels } = cached;
    const hdr  = ["Player", "Type", "Position", ...seasonLabels];
    const data  = filtered.map(p => [
      p.name, p.status, p.position,
      ...seasonLabels.map(s => {
        const se = p.seasons[s];
        return [se?.team, se?.detail].filter(Boolean).join(" – ");
      }),
    ]);
    rows     = [hdr, ...data];
    filename = `${activeTeam().name.replace(/\s+/g, "-")}-contracts.csv`;
  }

  const csv  = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(player, team) {
  selectedPlayer = player;
  modalTeam      = team;

  const allSeasons     = Object.keys(player.seasons).sort();
  const currentSeasons = allSeasons.filter(s =>  CURRENT_SEASONS.includes(s));
  const historicalRevd = allSeasons.filter(s => !CURRENT_SEASONS.includes(s)).reverse();
  const hasHistory     = historicalRevd.some(s => player.seasons[s].team || player.seasons[s].detail);

  el.modalName.textContent = player.name;
  el.modalMeta.innerHTML   = [
    player.status   ? `<span class="badge ${badgeClass(player.status)}">${esc(player.status)}</span>` : "",
    player.position ? `<span class="modal-meta-txt">${esc(player.position)}</span>` : "",
    `<span class="modal-meta-txt"><img src="${esc(team.logo)}" class="modal-team-logo" alt="${esc(team.name)}"> ${esc(team.name)}</span>`,
  ].join("");

  function seasonRowHTML(label, isCur) {
    const s = player.seasons[label];
    if (!s) return "";
    const empty = !s.team && !s.detail;
    if (!isCur && empty) return "";
    const dc = dotClass(s.team, s.detail);
    return `<div class="season-row${isCur ? " cur" : ""}">
      <span class="season-lbl ${isCur ? "cur" : "hist"}">${esc(label)}</span>
      ${empty
        ? `<span class="season-empty">—</span>`
        : `<div class="season-content">
            ${s.team   ? `<span class="season-team"><span class="dot ${dc}"></span>${esc(s.team)}</span>`   : ""}
            ${s.detail ? `<span class="season-detail">${esc(s.detail)}</span>`                              : ""}
           </div>`}
    </div>`;
  }

  el.modalBody.innerHTML = `
    <div>
      <p class="modal-section-title cur">Current &amp; Future</p>
      <div class="season-rows">${currentSeasons.map(s => seasonRowHTML(s, true)).join("")}</div>
    </div>
    ${hasHistory ? `
    <div>
      <p class="modal-section-title hist">Career History</p>
      <div class="season-rows">${historicalRevd.map(s => seasonRowHTML(s, false)).join("")}</div>
    </div>` : ""}`;

  el.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  selectedPlayer = null;
  modalTeam      = null;
  el.modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// ── Event listeners ────────────────────────────────────────
el.refreshBtn.addEventListener("click", () => {
  loadTeam(activeTeam().gid, true).then(() => renderTabs());
});
el.errorRetry.addEventListener("click", () => {
  loadTeam(activeTeam().gid, true).then(() => renderTabs());
});
el.searchInput.addEventListener("input", e => {
  search = e.target.value;
  renderState();
});
el.filterBtn.addEventListener("click", () => {
  if (globalMode) return;
  showFilters = !showFilters;
  renderSearchControls();
});
el.globalBtn.addEventListener("click", () => {
  globalMode = !globalMode;
  if (globalMode) {
    showFilters = false;
    loadAllTeams();
  }
  renderState();
  renderTabs();
});
el.clearBtn.addEventListener("click", () => {
  search = ""; statusFilter = "All";
  el.searchInput.value = "";
  renderState();
});
el.statusSel.addEventListener("change", e => {
  statusFilter = e.target.value;
  renderState();
});
el.exportBtn.addEventListener("click", exportCSV);
el.modalClose.addEventListener("click", closeModal);
el.modalBdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && selectedPlayer) closeModal();
});

// ── Init ───────────────────────────────────────────────────
renderTabs();
renderState();
loadTeam(NBL_TEAMS[0].gid).then(() => renderTabs());
