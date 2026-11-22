/* Story Palace — shared utilities: storage, sensory-adaptive profile engine,
   spaced repetition, upgraded link/beat coaching, Major System encoder,
   optional Web Speech audio rehearsal, and export/import. */

"use strict";

const STORE_KEY = "story-palace-v1";

function defaultStore() {
    return {
        version: 1,
        customPalaces: [],
        lists: [],
        assessment: null,
        prefs: { encodingMode: "auto" },
        gym: { pairs: [] },
        workshop: { abstracts: [], numbers: [], names: [] },
    };
}

function loadStore() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return defaultStore();
        const parsed = JSON.parse(raw);
        const base = defaultStore();
        const merged = Object.assign(base, parsed);
        merged.prefs = Object.assign({ encodingMode: "auto" }, parsed.prefs || {});
        merged.gym = Object.assign({ pairs: [] }, parsed.gym || {});
        merged.workshop = Object.assign(
            { abstracts: [], numbers: [], names: [] },
            parsed.workshop || {}
        );
        return merged;
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

/* ---- Sensory profile & adaptive encoding mode ----
   Supports both legacy assessments (vividScore + channels) and multi-sensory
   assessments (vividScore + sensory.{sound,smell,touch,spatial,emotion}). */

function getUserProfile(store) {
    const a = store && store.assessment;
    if (!a) return null;
    const sensory = a.sensory || null;
    const lowVisual = a.vividScore <= 10;
    const aphantasic = a.vividScore <= 6;
    const lowSound = sensory ? sensory.sound <= 2 : false;
    const lowSmell = sensory ? sensory.smell <= 2 : false;
    const lowTouch = sensory ? sensory.touch <= 2 : false;
    const strongSpatial = sensory ? sensory.spatial >= 3 : false;
    const multisensoryLow = sensory
        ? (sensory.sound + sensory.smell + sensory.touch) <= 6
        : false;
    const channels = a.channels || {};
    const best = Math.max(0, ...Object.values(channels));
    const topChannels = best > 0
        ? Object.keys(channels).filter((k) => channels[k] === best)
        : [];
    return {
        raw: a,
        lowVisual,
        aphantasic,
        lowSound,
        lowSmell,
        lowTouch,
        strongSpatial,
        multisensoryLow,
        topChannels,
        subtype: a.subtype || a.band || "",
    };
}

/* Returns "logic-only" or "balanced".
   In "logic-only" mode, hooks swap imagined smell/sound/touch cues for pure
   spatial, causal, wordplay, and real physical enactment cues — crucial for
   multisensory / total aphantasia and anauralia. */
function effectiveEncodingMode(store) {
    const pref = (store && store.prefs && store.prefs.encodingMode) || "auto";
    if (pref === "logic-only" || pref === "balanced") return pref;
    const profile = getUserProfile(store);
    if (profile && profile.multisensoryLow) return "logic-only";
    return "balanced";
}

function hookBeatForMode(hook, mode) {
    if (mode === "logic-only" && hook.logicBeat) return hook.logicBeat;
    return hook.beat;
}

function promptForHook(hook, mode, profile) {
    const type = hook.type;
    const skipSensory = mode === "logic-only" ||
        (type === "sound" && profile && profile.lowSound) ||
        (type === "smell" && profile && profile.lowSmell) ||
        (type === "touch" && profile && profile.lowTouch);
    if (skipSensory) {
        if (hook.enact) {
            return `Zero-imagery cue: do the action (${hook.enact.replace(/\.$/, "")}), then state a rule, pun, or consequence linking your item to “${hook.label}”.`;
        }
        return `Logic/rule cue: what fact, wordplay, or cause-and-effect binds your item to “${hook.label}”?`;
    }
    const PROMPTS = {
        sound: "What sound, rhythm, or rhyme does your item make at this beat?",
        smell: "What does your item smell or taste like here — or what clash happens?",
        touch: "How does your item feel here — texture, weight, pressure, or temperature?",
        motion: "What physical action do you do with your item at this beat?",
        spatial: "Where exactly does your item sit, block, or lean in this coordinate?",
        logic: "What does your item cause, force, or prevent at this beat?",
    };
    return PROMPTS[type] || "Connect your item to this beat with an action, rule, or consequence.";
}

function recommendedPalaceIds(profile) {
    if (!profile) return [];
    const recs = [];
    if (profile.multisensoryLow || profile.strongSpatial || profile.topChannels.includes("spatial")) {
        recs.push("room");
    }
    if (profile.topChannels.includes("sensorimotor")) recs.push("body");
    if (profile.topChannels.includes("verbal")) recs.push("rhythm");
    if (profile.topChannels.includes("narrative")) recs.push("journey");
    if (profile.topChannels.includes("semantic")) recs.push("room", "journey");
    if (recs.length === 0) recs.push("body", "day");
    return [...new Set(recs)];
}

/* ---- Palaces ---- */

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

/* ---- Spaced Repetition (Leitner / SM-2-lite) ----
   Intervals in hours per mastery box: 0 (due now), 10 min, 1 day, 3 days,
   7 days, 16 days, 35 days. Backward-compatible with { ok, total } stats. */

const SRS_INTERVAL_HOURS = [0, 0.17, 24, 72, 168, 384, 840];

function updateSrsStats(prev, rating) {
    // rating: "miss" | "hard" | "good" (or boolean for backward compat)
    const r = rating === true ? "good" : rating === false ? "miss" : rating;
    const s = Object.assign({ ok: 0, total: 0, box: 0, streak: 0, nextDue: null, lastReviewed: null }, prev || {});
    s.total++;
    const now = Date.now();
    if (r === "good") {
        s.ok++;
        s.streak = (s.streak || 0) + 1;
        s.box = Math.min(SRS_INTERVAL_HOURS.length - 1, (s.box || 0) + 1);
    } else if (r === "hard") {
        s.ok++;
        s.streak = Math.max(1, s.streak || 0);
        s.box = Math.max(1, Math.min(s.box || 1, 2));
    } else {
        s.streak = 0;
        s.box = 0;
    }
    const hours = SRS_INTERVAL_HOURS[s.box];
    s.lastReviewed = new Date(now).toISOString();
    s.nextDue = new Date(now + hours * 3600 * 1000).toISOString();
    return s;
}

function isSrsDue(stat, nowMs = Date.now()) {
    if (!stat || !stat.total) return true; // never practiced yet
    if (!stat.nextDue) return (stat.ok / stat.total) < 0.85;
    return new Date(stat.nextDue).getTime() <= nowMs;
}

function masteryTier(stat) {
    if (!stat || !stat.total) return "new";
    if (isSrsDue(stat)) return "due";
    if ((stat.box || 0) >= 4 || (stat.ok / stat.total >= 0.9 && stat.total >= 3)) return "strong";
    return "ok";
}

function formatNextDue(stat) {
    if (!stat || !stat.total) return "new";
    if (!stat.nextDue) return "due now";
    const diffMs = new Date(stat.nextDue).getTime() - Date.now();
    if (diffMs <= 60000) return "due now";
    const mins = Math.round(diffMs / 60000);
    if (mins < 90) return `in ${mins}m`;
    const hours = Math.round(diffMs / 3600000);
    if (hours < 36) return `in ${hours}h`;
    const days = Math.round(hours / 24);
    return `in ${days}d`;
}

function dueCountForList(palace, list) {
    const filled = palace.hooks.filter((h) => list.entries[h.n] && list.entries[h.n].item.trim());
    if (filled.length === 0) return 0;
    const perHook = (list.stats && list.stats.perHook) || {};
    return filled.filter((h) => isSrsDue(perHook[h.n])).length;
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

/* Anki-importable CSV: front = palace + numbered hook (+ enactment), back = item + association. */
function exportListAsAnkiCsv(palace, list) {
    const rows = [];
    for (const hook of palace.hooks) {
        const entry = list.entries[hook.n];
        if (!entry || !entry.item) continue;
        const front = `${palace.name} · Hook ${hook.n}: ${hook.label}` +
            (hook.enact ? ` (${hook.enact})` : "");
        const back = entry.assoc ? `${entry.item} — ${entry.assoc}` : entry.item;
        rows.push(csvCell(front) + "," + csvCell(back));
    }
    const safe = list.name.replace(/[^\w-]+/g, "_").toLowerCase() || "list";
    downloadFile(`story-palace-${safe}.csv`, "text/csv", rows.join("\n") + "\n");
}

/* External Recoding export: clean plain-Markdown study sheet. */
function exportListAsMarkdown(palace, list, mode = "balanced") {
    const lines = [`# ${list.name} (${palace.name})`, ""];
    for (const hook of palace.hooks) {
        const entry = list.entries[hook.n];
        if (!entry || !entry.item) continue;
        const beatPlain = hookBeatForMode(hook, mode).replace(/<\/?em>/g, "**");
        lines.push(`## ${hook.n}. ${hook.label} → ${entry.item}`);
        if (hook.enact) lines.push(`- **Action:** ${hook.enact}`);
        lines.push(`- **Beat:** ${beatPlain}`);
        if (entry.assoc) lines.push(`- **Link:** ${entry.assoc}`);
        lines.push("");
    }
    const safe = list.name.replace(/[^\w-]+/g, "_").toLowerCase() || "list";
    downloadFile(`story-palace-${safe}.md`, "text/markdown", lines.join("\n"));
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
            const merged = Object.assign(defaultStore(), parsed);
            merged.prefs = Object.assign({ encodingMode: "auto" }, parsed.prefs || {});
            merged.gym = Object.assign({ pairs: [] }, parsed.gym || {});
            merged.workshop = Object.assign(
                { abstracts: [], numbers: [], names: [] },
                parsed.workshop || {}
            );
            saveStore(merged);
            onDone(null);
        } catch (e) {
            onDone(e);
        }
    };
    reader.onerror = () => onDone(reader.error);
    reader.readAsText(file);
}

/* ---- Upgraded Link-Quality & Anti-Visual-Trap Coach ----
   Evaluates associations across proven imagery-free mechanisms:
     1. Both anchors named (item + hook)
     2. Causal / Logical rule
     3. Physical action / Enactment
     4. Wordplay / Phonology / Rhythm (or alliteration/rhyme)
     5. Distinctiveness / Emotion / Contrast (von Restorff effect)
     6. Anti-Visual-Trap detector: flags passive "picture / looks like / bright red"
        habits that underperform without a mind's eye. */

const CAUSAL_PATTERN = new RegExp(
    "\\b(because|so|since|therefore|until|unless|instead|whenever|if|then|" +
    "forc\\w*|mak\\w*|made|caus\\w*|trigger\\w*|driv\\w*|drove|lead\\w*|led|" +
    "prevent\\w*|block\\w*|stop\\w*|requir\\w*|prov\\w*|unlock\\w*|replace\\w*|" +
    "rule|means|only works|must|cannot|can't|has to|have to|need\\w*|without)\\b", "i");

const ACTION_PATTERN = new RegExp(
    "\\b(knock\\w*|push\\w*|pull\\w*|drag\\w*|slam\\w*|crash\\w*|crack\\w*|" +
    "smash\\w*|spill\\w*|break\\w*|broke|burst\\w*|shov\\w*|throw\\w*|threw|" +
    "drop\\w*|fell|fall\\w*|hit\\w*|slap\\w*|bang\\w*|pour\\w*|burn\\w*|" +
    "squeez\\w*|grab\\w*|grip\\w*|tear\\w*|tore|bit\\w*|kick\\w*|explod\\w*|" +
    "melt\\w*|freez\\w*|froze|sting\\w*|stung|shak\\w*|shook|rattl\\w*|roll\\w*|" +
    "press\\w*|tap\\w*|balanc\\w*|twist\\w*|tie\\w*|tied|step\\w*|trip\\w*|" +
    "jam\\w*|wedge\\w*|pin\\w*|lift\\w*|clamp\\w*|snap\\w*|spill\\w*|pour\\w*|" +
    "into|onto|through|against|under|over)\\b", "i");

const WORDPLAY_PATTERN = new RegExp(
    "\\b(rhyme\\w*|sounds? like|starts? with|spell\\w*|pun|acronym|beat|rhythm|" +
    "chant|sing\\w*|sang|echo\\w*|ring\\w*|rang|buzz\\w*|hum\\w*|shout\\w*|" +
    "whisper\\w*|click\\w*|clang\\w*|roar\\w*)\\b", "i");

const DISTINCT_PATTERN = new RegExp(
    "\\b(absurd\\w*|ridiculous|panic\\w*|laugh\\w*|embarrass\\w*|forbid\\w*|" +
    "illegal|backwards?|upside[- ]down|opposite|unlike|giant|tiny|freezing|" +
    "boiling|scream\\w*|shock\\w*|surprise\\w*|refus\\w*|steal\\w*|stole|" +
    "explod\\w*|impossible|never|always|wrong)\\b", "i");

const VISUAL_TRAP_PATTERN = new RegExp(
    "\\b(picture|visuali[sz]\\w*|imagine seeing|looks? like|seeing a|see a|" +
    "mental image|bright (red|blue|green|yellow|purple|orange|pink)|" +
    "glowing (red|blue|green|yellow|purple)|shiny (red|blue|green|gold)|" +
    "sits? next to|sitting next to|standing next to|is beside)\\b", "i");

function containsWordOf(sentence, phrase) {
    const rawWords = String(phrase || "").toLowerCase().split(/[\s/-]+/).filter(Boolean);
    const words = rawWords.filter((w) => w.length > 2);
    const checkList = words.length ? words : rawWords;
    if (checkList.length === 0) return true;
    const low = sentence.toLowerCase();
    return checkList.some((w) => {
        const clean = w.replace(/[^a-z0-9]/g, "");
        if (!clean) return false;
        const stem = clean.replace(/(ies|es|s)$/, "");
        const base = stem.length > 2 ? stem : clean;
        const re = new RegExp("\\b" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*", "i");
        return re.test(low);
    });
}

function hasSharedStartOrRhyme(a, b) {
    const wa = String(a || "").toLowerCase().replace(/[^a-z]/g, "");
    const wb = String(b || "").toLowerCase().replace(/[^a-z]/g, "");
    if (wa.length < 3 || wb.length < 3 || wa === wb) return false;
    return wa.slice(0, 2) === wb.slice(0, 2) || wa.slice(-3) === wb.slice(-3);
}

function analyzeLink(sentence, itemWord, hookWord) {
    const s = String(sentence || "").trim();
    if (!s) return null;

    const tips = [];
    const warnings = [];
    const strengths = [];

    if (itemWord && !containsWordOf(s, itemWord)) {
        tips.push(`Name the item — put “${itemWord}” in the sentence.`);
    }
    if (hookWord && !containsWordOf(s, hookWord)) {
        tips.push(`Name the hook — put “${hookWord}” in the sentence.`);
    }

    const hasCause = CAUSAL_PATTERN.test(s);
    const hasAction = ACTION_PATTERN.test(s);
    const hasWordplay = WORDPLAY_PATTERN.test(s) || hasSharedStartOrRhyme(itemWord, hookWord);
    const hasDistinct = DISTINCT_PATTERN.test(s);

    if (hasCause) strengths.push("⚡ logic/cause");
    if (hasAction) strengths.push("✋ action");
    if (hasWordplay) strengths.push("♪ sound/wordplay");
    if (hasDistinct) strengths.push("★ distinctive");

    if (!hasCause && !hasAction && !hasWordplay && !hasDistinct) {
        tips.push("Add a non-visual engine: a cause (because/forces), an action (slams/grabs), a contrast, or wordplay.");
    }
    if (s.split(/\s+/).length < 5) {
        tips.push("Give it one more beat — what happens or why does that rule hold?");
    }
    if (VISUAL_TRAP_PATTERN.test(s)) {
        warnings.push("Visual trap: passive appearance or “next to” fades without a mind's eye — swap for a cause, action, or rule.");
    }

    return { tips, warnings, strengths, ok: tips.length === 0 && warnings.length === 0 };
}

/* Backward-compatible wrapper returning tips array (or null). */
function linkCoach(sentence, itemWord, hookWord) {
    const res = analyzeLink(sentence, itemWord, hookWord);
    if (!res) return null;
    return res.tips.concat(res.warnings);
}

/* Renders rich HTML feedback for any coach container element. */
function renderCoachFeedback(el, analysis) {
    if (!el) return;
    if (!analysis) {
        el.innerHTML = "";
        el.className = "coach";
        return;
    }
    if (analysis.tips.length === 0 && analysis.warnings.length === 0) {
        const tags = analysis.strengths.map((t) => `<span class="strength-tag">${escapeHtml(t)}</span>`).join(" ");
        el.innerHTML = `✓ Strong link ${tags}`;
        el.className = "coach ok";
        return;
    }
    const parts = [];
    if (analysis.warnings.length) {
        parts.push(`<span class="coach-warn-text">⚠ ${escapeHtml(analysis.warnings.join(" "))}</span>`);
    }
    if (analysis.tips.length) {
        parts.push(escapeHtml(analysis.tips.join(" ")));
    }
    if (analysis.strengths.length) {
        parts.push(`<span class="muted">(${escapeHtml(analysis.strengths.join(" · "))})</span>`);
    }
    el.innerHTML = parts.join(" ");
    el.className = analysis.warnings.length ? "coach warn" : "coach";
}

/* Beat coach for builder.html: checks hook word, catches visual-only habits,
   and encourages sequential/causal transitions between adjacent beats. */
const CHAIN_CONNECTIVE_PATTERN = /\b(then|next|so|because|beyond|past|after|from|leads?|carries?|drives?|brings?|step|turn|move|inside|below|above|opposite|leaving|reaching|until|against)\b/i;

function analyzeBeat(beatText, label, prevLabel, index) {
    const s = String(beatText || "").trim();
    if (!s) return null;
    const tips = [];
    const warnings = [];
    const strengths = [];

    if (label && !s.toLowerCase().includes(label.toLowerCase())) {
        tips.push(`Include the hook word “${label}” inside the beat.`);
    }
    if (VISUAL_TRAP_PATTERN.test(s) || /\b(you see|looks? (red|blue|green|bright|pretty)|colorful|glitter\w*)\b/i.test(s)) {
        warnings.push("Visual-only wording detected — swap how it looks for position, action, sound, feel, or consequence.");
    }
    if (CAUSAL_PATTERN.test(s)) strengths.push("⚡ cause");
    if (ACTION_PATTERN.test(s)) strengths.push("✋ action");
    if (/\b(left|right|corner|center|top|bottom|wall|floor|above|below|ahead|behind|step|forward)\b/i.test(s)) {
        strengths.push("⌖ spatial");
    }
    if (index > 0) {
        const linksPrev = (prevLabel && containsWordOf(s, prevLabel)) || CHAIN_CONNECTIVE_PATTERN.test(s);
        if (linksPrev) strengths.push("⛓ chained");
        else tips.push(prevLabel
            ? `Chain rule: connect from “${prevLabel}” using then/so/past/because.`
            : "Chain rule: add a transition (then, next, past, because, so).");
    }
    return { tips, warnings, strengths, ok: tips.length === 0 && warnings.length === 0 };
}

/* One-tap starter frames covering causal, enactment, semantic, wordplay, and
   distinctiveness channels. {item}/{hook} get substituted. */
const LINK_FRAMES = [
    { label: "Because…", mode: "any", text: "Because of the {hook}, the {item} must " },
    { label: "Crashes into…", mode: "any", text: "The {item} slams straight into the {hook}, forcing " },
    { label: "Without…", mode: "any", text: "Without the {item}, the {hook} cannot " },
    { label: "I physically…", mode: "logic-only", text: "At the {hook}, I grab the {item} and " },
    { label: "Rule / Fact…", mode: "logic-only", text: "The strict rule at the {hook} is that {item} always " },
    { label: "Sounds like…", mode: "any", text: "Saying {hook} triggers {item} because it sounds like " },
    { label: "Absurdly…", mode: "any", text: "Absurdly, the {hook} refuses to work until the {item} " },
];

function framesForMode(mode) {
    if (mode === "logic-only") {
        // Put pure logic, action, rule, and wordplay frames first.
        return [
            LINK_FRAMES[0], LINK_FRAMES[4], LINK_FRAMES[3],
            LINK_FRAMES[2], LINK_FRAMES[5], LINK_FRAMES[6],
        ];
    }
    return [
        LINK_FRAMES[0], LINK_FRAMES[1], LINK_FRAMES[2],
        LINK_FRAMES[4], LINK_FRAMES[5], LINK_FRAMES[6],
    ];
}

/* ---- Link Gym word banks ---- */

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

/* Abstract study & everyday concepts — trains the hardest non-visual skill:
   turning intangible ideas into causal rules or concrete interactions. */
const GYM_ABSTRACT_WORDS = [
    "algorithm", "altruism", "ambiguity", "arbitrage", "autonomy", "bias",
    "bureaucracy", "catalyst", "causality", "censorship", "compound interest",
    "consensus", "correlation", "deadline", "delegation", "deterrence",
    "dissonance", "efficiency", "empathy", "entropy", "equilibrium", "ethics",
    "feedback loop", "friction", "gravity", "habit", "hegemony", "hypothesis",
    "incentive", "inertia", "inflation", "irony", "jurisdiction", "latency",
    "leverage", "liquidity", "metaphor", "momentum", "monopoly", "nostalgia",
    "opportunity cost", "osmosis", "paradox", "placebo", "precedent",
    "probability", "protocol", "recursion", "redundancy", "resilience",
    "scarcity", "skepticism", "sovereignty", "sunk cost", "symmetry",
    "synergy", "tariff", "threshold", "trade-off", "variance", "velocity",
];

function pickDistinct(list, count) {
    const copy = list.slice();
    const out = [];
    while (out.length < count && copy.length) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}

function dealGymPair(mode = "concrete") {
    if (mode === "abstract") {
        const a = GYM_ABSTRACT_WORDS[Math.floor(Math.random() * GYM_ABSTRACT_WORDS.length)];
        const b = GYM_WORDS[Math.floor(Math.random() * GYM_WORDS.length)];
        return [a, b];
    }
    if (mode === "chain") {
        return pickDistinct(GYM_WORDS, 3);
    }
    return pickDistinct(GYM_WORDS, 2);
}

/* ---- Phonetic Major System (Non-Visual Number Encoder) ----
   Digits map to consonant sounds (vowels & h/w/y are free fillers):
   0 = s, z | 1 = t, d | 2 = n | 3 = m | 4 = r | 5 = l
   6 = j, sh, ch | 7 = k, hard g | 8 = f, v | 9 = p, b */

const MAJOR_DIGITS = [
    { d: "0", sounds: "s, z, soft c", mnemonic: "Zero starts with Z" },
    { d: "1", sounds: "t, d, th", mnemonic: "t and d have 1 downstroke" },
    { d: "2", sounds: "n", mnemonic: "n has 2 downstrokes" },
    { d: "3", sounds: "m", mnemonic: "m has 3 downstrokes" },
    { d: "4", sounds: "r", mnemonic: "fouR ends with R" },
    { d: "5", sounds: "l", mnemonic: "Roman L = 50 (5 fingers)" },
    { d: "6", sounds: "j, sh, ch, soft g", mnemonic: "6 looks like a flipped J" },
    { d: "7", sounds: "k, hard g, q", mnemonic: "K is built from two 7s" },
    { d: "8", sounds: "f, v", mnemonic: "cursive f has two loops like 8" },
    { d: "9", sounds: "p, b", mnemonic: "9 is a mirror P" },
];

const MAJOR_WORDS = {
    "0": ["saw", "sea", "ice", "zoo"],
    "1": ["tie", "tea", "hat", "day"],
    "2": ["hen", "knee", "honey", "Noah"],
    "3": ["ham", "home", "yam", "ma"],
    "4": ["oar", "rye", "ear", "arrow"],
    "5": ["law", "owl", "heel", "oil"],
    "6": ["shoe", "jaw", "ash", "joy"],
    "7": ["key", "cow", "oak", "egg"],
    "8": ["ivy", "hive", "foe", "wave"],
    "9": ["bee", "pie", "bow", "ape"],
    "00": ["sauce", "seesaw"], "01": ["seat", "soda", "suit"], "02": ["sun", "sign", "swan"],
    "03": ["sum", "seam"], "04": ["sore", "sire", "sewer"], "05": ["sail", "seal", "soil"],
    "06": ["sash", "sushi"], "07": ["sock", "sack", "sky"], "08": ["safe", "sofa"], "09": ["soap", "soup", "sub"],
    "10": ["toes", "dice", "desk"], "11": ["toad", "tide", "date"], "12": ["tin", "tune", "den"],
    "13": ["team", "dime", "dome"], "14": ["tire", "door", "deer"], "15": ["tail", "bell-toll", "tile", "doll"],
    "16": ["dish", "ditch", "tissue"], "17": ["tack", "dock", "duck"], "18": ["dove", "tofu", "dive"], "19": ["tape", "tub", "top"],
    "20": ["nose", "news", "noose"], "21": ["net", "nut", "knot"], "22": ["nun", "neon", "onion"],
    "23": ["name", "gnome"], "24": ["narrow", "snore", "nero"], "25": ["nail", "knoll"],
    "26": ["notch", "niche"], "27": ["neck", "nook", "ink"], "28": ["knife", "navy"], "29": ["knob", "nap", "nib"],
    "30": ["mouse", "moss", "maze"], "31": ["mat", "mud", "meat"], "32": ["moon", "man", "mine"],
    "33": ["mummy", "mime"], "34": ["mare", "hammer", "mirror"], "35": ["mail", "mill", "mule"],
    "36": ["match", "mesh"], "37": ["mug", "mic", "mac"], "38": ["muff", "movie"], "39": ["map", "mop", "mob"],
    "40": ["rose", "rice", "race"], "41": ["rat", "rod", "radio"], "42": ["rain", "horn", "run"],
    "43": ["ram", "rim", "room"], "44": ["roar", "rear", "rower"], "45": ["rail", "roll", "reel"],
    "46": ["rash", "arch", "roach"], "47": ["rock", "rake", "rug"], "48": ["roof", "raft", "reef"], "49": ["rope", "harp", "rib"],
    "50": ["lace", "lasso", "lens"], "51": ["lid", "lute", "latte"], "52": ["line", "lion", "lane"],
    "53": ["lime", "loom", "lamb"], "54": ["lure", "liar", "lyre"], "55": ["lily", "lull"],
    "56": ["latch", "leash", "ledge"], "57": ["lock", "lake", "log"], "58": ["leaf", "loaf", "lava"], "59": ["lip", "loop", "lab"],
    "60": ["cheese", "chess", "juice"], "61": ["jet", "sheet", "chute"], "62": ["chain", "chin", "shin"],
    "63": ["jam", "gem", "chime"], "64": ["jar", "chair", "chore"], "65": ["jail", "shell", "chill"],
    "66": ["judge", "church"], "67": ["chalk", "jug", "shock"], "68": ["chef", "shove", "chaff"], "69": ["ship", "chip", "shop"],
    "70": ["case", "goose", "gas"], "71": ["cat", "kite", "gate"], "72": ["can", "coin", "cane"],
    "73": ["comb", "gum", "game"], "74": ["car", "gear", "core"], "75": ["coal", "coil", "quill"],
    "76": ["cage", "cash", "couch"], "77": ["cake", "cork", "gong"], "78": ["cave", "cuff", "coffee"], "79": ["cup", "cap", "cab"],
    "80": ["vase", "fuse", "fuzz"], "81": ["foot", "vat", "vet"], "82": ["fan", "van", "fin"],
    "83": ["foam", "fume"], "84": ["fire", "fur", "ferry"], "85": ["file", "foil", "veil"],
    "86": ["fish", "fudge"], "87": ["fog", "fig", "fork"], "88": ["fife", "five"], "89": ["fob", "fib", "vip"],
    "90": ["bus", "base", "bees"], "91": ["bat", "boat", "boot"], "92": ["pen", "pan", "bone"],
    "93": ["beam", "boom", "palm"], "94": ["bear", "pear", "bar"], "95": ["bell", "ball", "bowl"],
    "96": ["badge", "bench", "peach"], "97": ["book", "bag", "bike"], "98": ["beef", "puff", "beehive"], "99": ["pipe", "bib", "pub"],
};

function majorEncodeDigits(rawInput) {
    const digits = String(rawInput || "").replace(/\D/g, "");
    if (!digits) return [];
    const chunks = [];
    let i = 0;
    while (i < digits.length) {
        if (i + 2 <= digits.length) {
            const pair = digits.slice(i, i + 2);
            chunks.push({ digits: pair, words: MAJOR_WORDS[pair] || [pair] });
            i += 2;
        } else {
            const single = digits.slice(i, i + 1);
            chunks.push({ digits: single, words: MAJOR_WORDS[single] || [single] });
            i += 1;
        }
    }
    return chunks;
}

/* ---- Optional Web Speech API (Audio Rehearsal / Production Aid) ---- */

function speechSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

let _speechCancelled = false;

function stopSpeaking() {
    _speechCancelled = true;
    if (speechSupported()) window.speechSynthesis.cancel();
}

function speakSequence(items, { rate = 0.95, onStep, onEnd } = {}) {
    if (!speechSupported() || !items.length) { if (onEnd) onEnd(); return; }
    window.speechSynthesis.cancel();
    _speechCancelled = false;
    let i = 0;
    function next() {
        if (_speechCancelled || i >= items.length) {
            if (onEnd) onEnd();
            return;
        }
        const current = items[i];
        if (onStep) onStep(i, current);
        const utt = new SpeechSynthesisUtterance(current.text);
        utt.rate = rate;
        utt.onend = () => { i++; setTimeout(next, 280); };
        utt.onerror = () => { if (onEnd) onEnd(); };
        window.speechSynthesis.speak(utt);
    }
    next();
}

/* ---- Shared page chrome ---- */

function renderHeader(current) {
    const links = [
        ["index.html", "Home"],
        ["assess.html", "Self-check"],
        ["palace.html", "Story Palaces"],
        ["gym.html", "Link Gym"],
        ["strategies.html", "Strategies"],
        ["builder.html", "Build your own"],
    ];
    const nav = links
        .map(
            ([href, label]) =>
                `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`
        )
        .join("");
    let badge = "";
    try {
        const store = loadStore();
        const profile = getUserProfile(store);
        if (profile) {
            const mode = effectiveEncodingMode(store);
            const short = mode === "logic-only" ? "Zero-imagery lens" : (profile.aphantasic ? "Aphantasia profile" : "Profile saved");
            badge = `<a class="profile-pill" href="assess.html" title="Your sensory & strategy profile">${escapeHtml(short)}</a>`;
        }
    } catch (_) { /* ignore if storage blocked */ }
    return `
    <header class="site">
      <div class="wrap">
        <a class="brand" href="index.html">Story <span class="num">Palace</span></a>
        <nav class="main">${nav}</nav>
        ${badge}
      </div>
    </header>`;
}

function renderFooter() {
    return `
    <footer class="site">
      <div class="wrap">
        Story Palace — a free, open memory toolkit designed for people with
        aphantasia (including multisensory aphantasia and anauralia).
        Everything stays in your browser; nothing is uploaded. No visualization required, ever.
      </div>
    </footer>`;
}

function hookTypeChip(type) {
    const t = HOOK_TYPES[type] || { glyph: "·", label: type };
    return `<span class="chip" title="${escapeHtml(t.label)}">${t.glyph} ${escapeHtml(t.label)}</span>`;
}
