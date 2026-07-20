# Story Palace

A free memory toolkit designed for people with **aphantasia** — the ~1% of
people who have no mind's eye. Classic mnemonics keep saying "picture it
vividly"; this site never does. It rebuilds the memory palace on the channels
research shows stay strong without imagery: **sequence, logic, sound, smell,
touch, and story**.

Static HTML/CSS/JS — no build step, no server, no accounts. All user data
lives in the browser's `localStorage` (with JSON backup/restore).

**Live demo:** enable GitHub Pages for this repo (see [Deployment](#deployment))
and it will be published at `https://<your-username>.github.io/<your-repo>/`.

## What's a Story Palace?

A fixed, ordered sequence of numbered **hooks** wrapped in a short story. Each
hook is a story beat built from a sound, a smell, a touch, an action, or a
cause-and-effect turn. You attach ("inject") each thing you want to remember
to a hook with one association sentence. Replaying the story replays your
list — the hook is the gateway that brings the memory back.

## Pages

- [`index.html`](index.html) — landing page: the concept and the research it
  is built on, with citations.
- [`assess.html`](assess.html) — a 2-minute self-check: an adapted imagery
  vividness scale (VVIQ-inspired) plus strategy-preference questions, with a
  profile and recommendations. Not a diagnosis.
- [`palace.html`](palace.html) — the core tool. Three pre-built palaces:
  - **The Body** — 10 hooks (head → ear → eyes → … → chest); touch each part
    as you encode.
  - **The Day** — 25 hooks (alarm → stretch → … → pillow); a routine you
    already know by heart.
  - **The Journey** — 25 hooks (letter → boots → gate → … → home); every beat
    causes the next.

  Multiple independent lists per palace; practice modes (forward, reverse,
  random start, jump quiz) with self-grading and per-hook accuracy; Anki CSV
  export; JSON backup/restore.
- [`builder.html`](builder.html) — build custom palaces from a route, routine,
  or consequence chain of your own.

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
- Memory profile — episodic detail reduced, semantic/verbal/spatial intact:
  [eLife 94916](https://elifesciences.org/articles/94916),
  [Frontiers in Psychology 2025 (college students)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1615860/full)
- Preferred non-visual strategies: ["Unseen strategies", New Ideas in Psychology 2025](https://www.sciencedirect.com/science/article/pii/S0732118X25000716)
- Simple symbols beat rich photos: [Journal of Vision 2025](https://aphantasia.com/research/10.1167/jov.25.9.1974)
- Memory palaces work without visualization: [Art of Memory](https://artofmemory.com/blog/aphantasia/)

This site is an educational tool, not a medical instrument.

## License

[MIT](LICENSE)
