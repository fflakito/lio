# CLAUDE.md — LIO (Let It Out)

Context for future Claude Code sessions. Read this first.

## What this is

**LIO — Let It Out** is a local, browser-based free-writing app. It's a
positively-reframed clone of "The Most Dangerous Writing App": you pick a goal
(time or word count), then **keep typing**. If you pause longer than the *pause
window*, the page clears itself. Reach the goal and your words are yours to keep.

The original is fear-framed ("everything vanishes", "panic threshold"). LIO is
deliberately encouraging — momentum-green palette, gentle copy, confetti on
success. Keep that tone in any new copy.

## Core mechanic

- A `requestAnimationFrame` loop (`loop()` in `app.js`) tracks idle time since the
  last keystroke. The top **momentum bar** (`#decay`) drains as you idle and turns
  amber (`body.low`) when low.
- Idle ≥ `graceMs` → `lose()` (page clears). Goal reached → `win()`.
- `win()`/`lose()` both call `recordSession()` then `showEnd()`. A win fires
  `celebrate()` (confetti) and auto-opens the progress modal.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup only. Links `app.css` (head) + `app.js` (end of body). |
| `app.css` | All styles. Theming via CSS custom properties. |
| `app.js` | All logic, wrapped in one IIFE (nothing global). |
| `ROADMAP.md` | Feature roadmap — done items marked ✅. Update it as features land. |
| `.claude/` | Local preview server (`launch.json`, `server.js`). Not part of the app. |

## Hard constraints (do not break)

- **Locally accessible.** The app MUST keep working by double-clicking
  `index.html` over `file://`. Use **relative paths**, **no build step**, and
  **no external/CDN dependencies** — everything is vanilla and offline. (The
  confetti is hand-rolled canvas, not a library, for this reason.)
- **No framework.** Plain HTML/CSS/JS. Don't introduce npm/bundlers/React etc.
  unless the user explicitly asks and accepts losing single-folder portability.

## Conventions

- **Theming:** every color is a CSS variable in `:root`. Themes
  (`body.theme-sepia`, `body.theme-light`) and writing fonts (`body.font-sans`,
  `body.font-mono`) just override those variables — so new UI should use the
  tokens (`var(--accent)`, `var(--surface)`, `var(--ink)`, `var(--warn)`,
  `var(--on-accent)`, `var(--glow)`, etc.), never hardcoded hex. This keeps all
  three themes working for free.
- **State as body classes:** `hardcore` (blur mode), `typewriter` (centred-line
  scrolling), `low` (momentum low), `theme-*`, `font-*`.
- **Persistence:** `localStorage` only.
  - `lio.settings` — setup preferences (mode, timeVal, wordVal, graceMs,
    hardcore, typewriter, promptCat, theme, font). Saved on every change,
    restored in `loadSettings()`. (`migrateStorage()` copies the legacy
    `jgio.*` keys over on first load after the JGIO → LIO rename.)
  - `lio.history` — array of completed sessions `{t, won, words, goalType,
    goalVal, durationMs}`, capped at 200. Drives the progress modal + streaks.
  - A session is only logged when it reaches a terminal state (win or
    clear/Stop). Starting then reloading records nothing — by design.
- **Match the surrounding style** (2-space indent, semicolons, terse comments).

## Running / previewing

- Quickest for the user: open `index.html` in a browser.
- For driving/testing in-session: `preview_start` with the `lio` config in
  `.claude/launch.json` (a tiny Node static server on port 4599), then
  `preview_eval` to inspect/drive the page. To test a win fast, use the **25-word**
  goal: set words mode, click `25`, start, set `#editor` value to 30+ words and
  dispatch an `input` event.
- After editing `.claude/server.js`, restart the server (`preview_stop` +
  `preview_start`) — the process caches its own code.
- JS sanity check without a browser:
  `awk '/<script>/{...}' ` is no longer needed — just `node --check app.js`.

## Status

Done: writing prompts, adjustable pause window, settings persistence, session
history + streaks/stats, LIO rebrand, themes + fonts (in the Options "Visual
settings" section), file split, Markdown export, typewriter scrolling, and a
bolder editorial setup screen. See `ROADMAP.md` for what's next (custom goals,
.docx/append export, PWA, etc.).
