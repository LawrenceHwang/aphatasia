# Story Palace

A free, evidence-informed memory toolkit designed for people with
**aphantasia** — including **multisensory / total aphantasia** and
**anauralia** (no inner sound/voice). Classic mnemonics keep saying "picture
it vividly"; this site never does. It rebuilds memory techniques on the
channels cognitive science proves stay strong without visual imagery:
**spatial coordinates, causal logic, real physical enactment, spoken
production, semantic rules, wordplay, simple symbols, and spaced retrieval**.

Static HTML/CSS/JS — no build step, no server, no accounts. All user data
lives in the browser's `localStorage` (with JSON backup/restore).

**Live demo:** enable GitHub Pages for this repo (see [Deployment](#deployment))
and it will be published at `https://<your-username>.github.io/<your-repo>/`.

## What's a Non-Visual Story Palace?

A fixed, ordered sequence of numbered **hooks** anchored by real physical
micro-gestures (Enactment Effect), blindfolded spatial coordinates, rhyme
pegs, or cause-and-effect chains. You attach ("inject") each thing you want to
remember to a hook with one non-visual association sentence — guided by a live
coach that rewards causal/action/wordplay/distinctive links and catches
accidental "visual traps".

## Pages & Tools

- [`index.html`](index.html) — landing page: the concept, methods, and
  verified research citations.
- [`assess.html`](assess.html) — **3-minute multi-sensory self-check**
  (VVIQ + Psi-Q + spatial-vs-object inspired): gauges visual imagery, internal
  sound/smell/touch, blindfolded spatial awareness, and natural strategy
  channels. Automatically tailors prompts and palaces across the site (e.g.
  activating **Zero-Imagery: Logic + Action** lens for multisensory aphantasia
  and anauralia). Not a diagnosis.
- [`palace.html`](palace.html) — **Five pre-built palaces** + custom palaces:
  - **The Body** — 10 hooks (head → chest); physical touch/enactment anchors.
  - **The Room Grid** — 12 hooks; blindfolded clockwise spatial coordinates
    (built on intact spatial-position memory).
  - **The Rhythm Pegs** — 10 hooks (1-drum → 10-pen); instant direct-access
    number pegs using rhyme & the Production Effect.
  - **The Day** — 25 hooks (alarm → pillow); a deeply rehearsed daily routine.
  - **The Journey** — 25 hooks (letter → home); every beat causes the next.

  Includes an **Encoding Lens switcher** (`Auto` / `Balanced` / `Zero-imagery`),
  route dry-run rehearsal, optional browser **Read Aloud audio walk**,
  **Lukasa Spatial Map** (simple-symbol spatial grid colored by mastery),
  **Leitner/SM-2-lite spaced repetition** (`Smart Review`), **bidirectional
  recall** (`Hook → Item`, `Item → Hook`, `Mixed`), **Say aloud vs Type it**
  checking, **4-stage progressive cue fading** with auto-fade nudge,
  **instant inline rework** of missed hooks, Anki CSV export, Markdown study
  sheet export, and JSON backup/restore.
- [`gym.html`](gym.html) — **Link Gym**: trains forging fast non-visual links
  across three progressive workouts: **Concrete ⟶ Concrete**, **Abstract
  concept ⟶ Concrete** (for studying), and **3-Step Causal Chains**
  (`A ⟶ B ⟶ C`), with live anti-visual-trap coaching, spaced bidirectional
  quizzing, and inline re-forging of missed links.
- [`strategies.html`](strategies.html) — **Non-Visual Strategy Workshop**:
  - **Abstract-to-Anchor Translator**: Feynman plain-language rules +
    wordplay/root hooks + elaborative interrogation, with active quiz and
    one-click export to any Story Palace list.
  - **Numbers & Dates Encoder**: built-in interactive **Phonetic Major System**
    digit chunker + word picker to weave any number into a causal sentence or
    chant, with active recall quiz.
  - **Names-to-Facts Ledger**: 3-step verbal-semantic binding (Context +
    Wordplay cue + Fact + Bridge sentence) with bidirectional quiz.
  - **Evidence-Based Playbooks**: concise guides + copyable Markdown templates
    for Reading Fiction/Non-Fiction without a mind's movie, Exam Study Loops,
    Autobiographical Event Ledgers (SDAM support), and physical Desk Lukasa
    boards.
- [`builder.html`](builder.html) — custom palace builder with **one-click
  editable starter templates** (Home Spatial, Desk Lukasa, Commute, Ritual,
  Consequence Chain), optional physical enactment cues, live non-visual beat
  & chain-continuity coaching, and custom palace deletion.

## Getting started

```bash
npm start   # runs `npx serve .` on http://localhost:8643
```

Or any static file server (`python3 -m http.server`, etc.).

## Deployment

Deploys to **GitHub Pages via GitHub Actions**
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):

1. Push this repo to GitHub.
2. **Settings → Pages** → set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).

## The science (selected sources)

- Prevalence (~0.9% aphantasia): [Frontiers in Psychology 2024, n=9,063](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1454107/full)
- Multisensory aphantasia subtypes & Psi-Q profiling:
  [Dawes et al., Scientific Reports 2020](https://doi.org/10.1038/s41598-020-65705-7),
  [Dawes, Keogh & Pearson, Neuroscience Research 2024](https://doi.org/10.1016/j.neures.2023.11.009)
- Intact spatial memory despite absent visual object imagery:
  [Bainbridge et al., Cortex 2021](https://doi.org/10.1016/j.cortex.2020.11.014)
- Compensatory strategies & academic outcomes:
  [Frontiers in Psychology 2025](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1615860/full),
  ["Unseen strategies", New Ideas in Psychology 2025](https://www.sciencedirect.com/science/article/pii/S0732118X25000716)
- Simple symbols beat rich photos: [Journal of Vision 2025](https://aphantasia.com/research/10.1167/jov.25.9.1974)
- Embodied / non-visual memory palaces & lukasa boards: [Art of Memory](https://artofmemory.com/blog/aphantasia/)

This site is an educational tool, not a medical instrument.

## License

[MIT](LICENSE)
