/* Story Palace — shared utilities: storage, palace access, export/import. */

"use strict";

const STORE_KEY = "story-palace-v1";

function defaultStore() {
    return { version: 1, customPalaces: [], lists: [], assessment: null };
}

function loadStore() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return defaultStore();
        const parsed = JSON.parse(raw);
        return Object.assign(defaultStore(), parsed);
    } catch (e) {
        console.error("Failed to load store, starting fresh:", e);
        return defaultStore();
    }
}

function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

/* All palaces (pre-built + custom), normalized to one shape. */
function allPalaces(store) {
    const customs = (store.customPalaces || []).map((p) =>
        Object.assign({ tagline: `${p.hooks.length} hooks · custom`, custom: true }, p)
    );
    return PREBUILT_PALACES.concat(customs);
}

function getPalace(store, id) {
    return allPalaces(store).find((p) => p.id === id) || null;
}

function listsForPalace(store, palaceId) {
    return (store.lists || []).filter((l) => l.palaceId === palaceId);
}

/* ---- Export / import ---- */

function downloadFile(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(s) {
    return '"' + String(s ?? "").replaceAll('"', '""') + '"';
}

/* Anki-importable CSV: front = palace + numbered hook, back = item + association. */
function exportListAsAnkiCsv(palace, list) {
    const rows = [];
    for (const hook of palace.hooks) {
        const entry = list.entries[hook.n];
        if (!entry || !entry.item) continue;
        const front = `${palace.name} · Hook ${hook.n}: ${hook.label}`;
        const back = entry.assoc ? `${entry.item} — ${entry.assoc}` : entry.item;
        rows.push(csvCell(front) + "," + csvCell(back));
    }
    const safe = list.name.replace(/[^\w-]+/g, "_").toLowerCase() || "list";
    downloadFile(`story-palace-${safe}.csv`, "text/csv", rows.join("\n") + "\n");
}

function exportAllJson(store) {
    downloadFile(
        "story-palace-backup.json",
        "application/json",
        JSON.stringify(store, null, 2)
    );
}

function importAllJson(file, onDone) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            if (typeof parsed !== "object" || parsed === null || !("version" in parsed)) {
                throw new Error("Not a Story Palace backup file.");
            }
            saveStore(Object.assign(defaultStore(), parsed));
            onDone(null);
        } catch (e) {
            onDone(e);
        }
    };
    reader.onerror = () => onDone(reader.error);
    reader.readAsText(file);
}

/* ---- Shared page chrome ---- */

function renderHeader(current) {
    const links = [
        ["index.html", "Home"],
        ["assess.html", "Self-check"],
        ["palace.html", "Story Palaces"],
        ["builder.html", "Build your own"],
    ];
    const nav = links
        .map(
            ([href, label]) =>
                `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`
        )
        .join("");
    return `
    <header class="site">
      <div class="wrap">
        <a class="brand" href="index.html">Story <span class="num">Palace</span></a>
        <nav class="main">${nav}</nav>
      </div>
    </header>`;
}

function renderFooter() {
    return `
    <footer class="site">
      <div class="wrap">
        Story Palace — a free, open memory toolkit designed for people with
        aphantasia. Everything stays in your browser; nothing is uploaded.
        No visualization required, ever.
      </div>
    </footer>`;
}

function hookTypeChip(type) {
    const t = HOOK_TYPES[type] || { glyph: "·", label: type };
    return `<span class="chip" title="${escapeHtml(t.label)}">${t.glyph} ${escapeHtml(t.label)}</span>`;
}
