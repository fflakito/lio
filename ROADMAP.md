# LIO — Let It Out — Feature Roadmap

Ideas for future versions. ★ = recommended priority for v2.

## Core writing experience
- **★ Writing prompts** — optional random prompt on setup ("Describe a room you've never been in"), with categories (fiction, journaling, freewrite). _[✅ done — moved into a popover; default is no prompt]_
- **★ Adjustable grace period** — user picks panic threshold (3s / 5s / 7s / custom) instead of fixed 5s. _[✅ done — 3/5/7/10s, tucked under Options]_
- **Audio cue** — subtle heartbeat/ticking that speeds up as the decay bar drains; mutable.
- **Custom goals** — free-text field alongside presets (e.g. "750 words", "15 min").

## After you survive
- **Settings persistence (localStorage)** — remember goal, threshold, hardcore, prompt category across reloads. _[✅ done]_
- **★ Session history (localStorage)** — log each session: date, word count, duration, win/loss. Local, no account. _[✅ done — "📊 Progress" modal, last 12 sessions]_
- **★ Streaks & stats** — current streak, total words written, longest survival. _[✅ done — words written, sessions kept, current & best streak; streak nudge on win screen]_
- **Export options** — Markdown and .docx in addition to .txt; "append to today's file" mode. _[✅ Markdown done — "Download .md" on the win screen, with a date heading, the prompt as a blockquote, and a word/duration line. .docx + append-mode still open.]_
- **Typing analytics** — WPM, longest pause, pace-over-session graph.

## Polish & comfort
- **★ Light/sepia/dark themes** + font choices (serif/mono/sans). _[✅ done — under Options, persisted; confetti is theme-aware]_
- **Focus typewriter scrolling** — keep current line vertically centered. _[✅ done — opt-in toggle under Options; an off-screen mirror measures the caret and the editor scrolls to lock the active line at a fixed centre. Persisted in settings.]_
- **Fullscreen mode** + ambient background options.
- **Mobile/touch support** — tune keystroke-flash and layout for phones.

## Stakes & variants (the "dangerous" part)
- **Hardcore intensity levels** — blur vs. "only last word visible" vs. fully blacked-out.
- **Real consequences mode** (spicy, opt-in) — on failure, post a pre-written tweet / email yourself a shame note.
- **Resume protection** — crash-recovery for survived text only.

## Technical / distribution
- **PWA / installable** — manifest + service worker for true offline app with icon.
- **Single-file build** — keep everything inline so it stays one portable file.
