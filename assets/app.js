/* Story Palace — shared utilities: storage, palace access, export/import. */

"use strict";

const STORE_KEY = "story-palace-v1";

function defaultStore() {
    return { version: 1, customPalaces: [], lists: [], assessment: null, gym: { pairs: [] } };
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

/* ---- Link-quality coach ----
   Rule-based feedback on an association sentence. A strong link names both
   ends and pushes one into the other with action or cause — never a static
   "X is next to Y". Returns an array of tips; empty array = strong link. */

const CAUSAL_PATTERN = new RegExp(
    "\\b(because|so|since|therefore|until|which|forc\\w*|mak\\w*|made|caus\\w*|" +
    "trigger\\w*|driv\\w*|drove|knock\\w*|lead\\w*|led|push\\w*|pull\\w*|drag\\w*|" +
    "slam\\w*|crash\\w*|crack\\w*|smash\\w*|spill\\w*|break\\w*|broke|burst\\w*|" +
    "shov\\w*|throw\\w*|threw|drop\\w*|fell|fall\\w*|hit\\w*|slap\\w*|bang\\w*|" +
    "pour\\w*|burn\\w*|squeeze\\w*|grab\\w*|tear\\w*|tore|bit\\w*|kick\\w*|" +
    "explod\\w*|melt\\w*|freez\\w*|froze|sting\\w*|stung|shak\\w*|shook|rattl\\w*|" +
    "ring\\w*|rang|buzz\\w*|echo\\w*|roll\\w*|" +
    "into|onto|through|against|" +
    "must|cannot|can't|has to|have to|need\\w*)\\b", "i");

function containsWordOf(sentence, phrase) {
    const words = String(phrase || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return true;
    const low = sentence.toLowerCase();
    // Word-boundary match on the word or its singular stem, allowing suffixes
    // ("eggs" matches "egg cracks"; "ear" does not match "near").
    return words.some((w) => {
        const stem = w.replace(/(es|s)$/, "");
        const base = stem.length > 2 ? stem : w;
        const re = new RegExp("\\b" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*", "i");
        return re.test(low);
    });
}

function linkCoach(sentence, itemWord, hookWord) {
    const s = String(sentence || "").trim();
    if (!s) return null; // nothing to judge yet
    const tips = [];
    if (itemWord && !containsWordOf(s, itemWord)) {
        tips.push(`Name the item — put “${itemWord}” in the sentence.`);
    }
    if (hookWord && !containsWordOf(s, hookWord)) {
        tips.push(`Name the hook — put “${hookWord}” in the sentence.`);
    }
    if (!CAUSAL_PATTERN.test(s)) {
        tips.push("Add a push: because, so, forces, makes, crashes into…");
    }
    if (s.split(/\s+/).length < 5) {
        tips.push("Give it one more beat — what happens next?");
    }
    return tips;
}

/* One-tap starter frames for the association box. {item}/{hook} get substituted. */
const LINK_FRAMES = [
    { label: "Because…", text: "Because of the {hook}, the {item} must " },
    { label: "Crashes into…", text: "The {item} crashes into the {hook}, so " },
    { label: "Without…", text: "Without the {item}, the {hook} can't " },
    { label: "Makes…", text: "The {hook} makes the {item} " },
];

/* Concrete, causal-friendly nouns for the Link Gym. */
const GYM_WORDS = [
    "anchor", "anvil", "avalanche", "balloon", "barrel", "bell", "bicycle",
    "blanket", "bonfire", "bucket", "cactus", "candle", "chain", "chandelier",
    "chisel", "compass", "corkscrew", "dart", "dice", "dominoes", "doorbell",
    "drum", "eggshell", "engine", "envelope", "fan", "feather", "firework",
    "fountain", "glove", "gong", "hammer", "hammock", "harp", "helmet",
    "hosepipe", "icicle", "iron", "jackhammer", "jar", "jug", "kettle",
    "keyhole", "kite", "knot", "ladder", "lantern", "lawnmower", "lever",
    "lighthouse", "magnet", "matchstick", "megaphone", "mirror", "mop",
    "mousetrap", "nail", "needle", "nutcracker", "oar", "overcoat", "padlock",
    "parachute", "pillow", "pinwheel", "pulley", "pumpkin", "quicksand",
    "quilt", "raft", "rake", "rocket", "rope", "saddle", "sailboat",
    "scissors", "screwdriver", "shovel", "siren", "snowball", "sponge",
    "spring", "stapler", "teapot", "telescope", "tent", "toaster", "tractor",
    "trumpet", "turbine", "umbrella", "unicycle", "vacuum", "vinegar",
    "violin", "volcano", "waffle", "wheelbarrow", "whistle", "windmill",
    "xylophone", "yo-yo", "zipper",
];

function dealGymPair() {
    const i = Math.floor(Math.random() * GYM_WORDS.length);
    let j = Math.floor(Math.random() * (GYM_WORDS.length - 1));
    if (j >= i) j++;
    return [GYM_WORDS[i], GYM_WORDS[j]];
}

/* ---- Shared page chrome ---- */

function renderHeader(current) {
    const links = [
        ["index.html", "Home"],
        ["assess.html", "Self-check"],
        ["palace.html", "Story Palaces"],
        ["gym.html", "Link Gym"],
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
