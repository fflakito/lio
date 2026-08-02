(function () {
  const $ = s => document.querySelector(s);

  // ---- Prompt bank ----
  const PROMPTS = {
    freewrite: [
      "Write about the first thing you noticed when you woke up today.",
      "Describe a room you've never been in.",
      "What would you do with an extra hour that no one knew about?",
      "Start with the words 'I keep meaning to…' and don't stop.",
      "Describe the colour blue to someone who has never seen.",
      "Write down everything that's on your mind, no filter.",
      "What's a small thing that made you happy recently? Why?",
      "Describe the view from a window you remember well."
    ],
    fiction: [
      "A stranger hands you a key and says, 'You'll know what it opens.'",
      "The last message ever sent reads: …",
      "Write the opening of a story set entirely inside an elevator.",
      "Two people meet for the last time, but only one of them knows it.",
      "A door that has been locked for a hundred years finally opens.",
      "Your character finds a letter addressed to them in their own handwriting.",
      "The town has one rule, and today someone broke it.",
      "Describe a world where it has rained without stopping for ten years."
    ],
    journal: [
      "What are you avoiding right now, and why?",
      "Write a letter to yourself one year from today.",
      "What did you need to hear today? Say it to yourself.",
      "Describe a decision you're trying to make.",
      "What are you grateful for that you usually overlook?",
      "What would you do differently if no one was watching?",
      "Write about a moment this week you'd like to remember.",
      "What's draining your energy lately? Name it honestly."
    ]
  };

  // ---- Setup state ----
  let mode = 'time';            // 'time' | 'words'
  let timeVal = 3;              // minutes
  let wordVal = 100;            // words
  let graceMs = 5000;           // panic threshold
  let hardcore = false;
  let typewriter = false;       // keep the active line vertically centred
  let promptCat = 'none';       // 'none' | 'freewrite' | 'fiction' | 'journal'
  let promptText = '';          // current chosen prompt
  let theme = 'dark';           // 'dark' | 'sepia' | 'light'
  let font = 'serif';           // 'serif' | 'sans' | 'mono'

  function applyTheme() {
    document.body.classList.remove('theme-sepia', 'theme-light');
    if (theme === 'sepia') document.body.classList.add('theme-sepia');
    else if (theme === 'light') document.body.classList.add('theme-light');
  }
  function applyFont() {
    document.body.classList.remove('font-sans', 'font-mono');
    if (font === 'sans') document.body.classList.add('font-sans');
    else if (font === 'mono') document.body.classList.add('font-mono');
  }

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function newPrompt() {
    if (promptCat === 'none') { promptText = ''; return; }
    // avoid repeating the same prompt twice in a row when possible
    let p = pick(PROMPTS[promptCat]);
    if (PROMPTS[promptCat].length > 1) {
      while (p === promptText) p = pick(PROMPTS[promptCat]);
    }
    promptText = p;
  }

  // ---- Persistence ----
  const LS_KEY = 'lio.settings';
  function saveSettings() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ mode, timeVal, wordVal, graceMs, hardcore, typewriter, promptCat, theme, font }));
    } catch (e) { /* storage unavailable — ignore */ }
  }
  function setActiveOpt(target, val) {
    const grp = document.querySelector('.opts[data-target="' + target + '"]');
    if (!grp) return;
    [...grp.children].forEach(o => o.classList.toggle('active', +o.dataset.val === val));
  }

  // ---- Session history ----
  const HIST_KEY = 'lio.history';
  // One-time migration from the old "jgio.*" keys (app renamed JGIO → LIO).
  function migrateStorage() {
    try {
      [['jgio.settings', LS_KEY], ['jgio.history', HIST_KEY]].forEach(([oldK, newK]) => {
        if (localStorage.getItem(newK) === null) {
          const v = localStorage.getItem(oldK);
          if (v !== null) localStorage.setItem(newK, v);
        }
      });
    } catch (e) { /* storage unavailable — ignore */ }
  }
  function loadHistory() {
    try { const h = JSON.parse(localStorage.getItem(HIST_KEY)); return Array.isArray(h) ? h : []; }
    catch (e) { return []; }
  }
  function recordSession(won, words, durationMs) {
    const hist = loadHistory();
    hist.push({
      t: Date.now(), won: won, words: words,
      goalType: mode, goalVal: mode === 'time' ? timeVal : wordVal,
      durationMs: Math.round(durationMs)
    });
    if (hist.length > 200) hist.splice(0, hist.length - 200); // keep storage bounded
    try { localStorage.setItem(HIST_KEY, JSON.stringify(hist)); } catch (e) { /* ignore */ }
    return hist;
  }
  function computeStats(hist) {
    let wins = 0, totalWords = 0, best = 0, run = 0;
    for (const e of hist) {
      if (e.won) { wins++; totalWords += e.words || 0; run++; if (run > best) best = run; }
      else run = 0;
    }
    let current = 0;
    for (let i = hist.length - 1; i >= 0; i--) { if (hist[i].won) current++; else break; }
    return { total: hist.length, wins, totalWords, current, best };
  }
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtWhen(t) {
    const d = new Date(t);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + hh + ':' + mm;
  }

  const seg = $('#mode-seg');
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.mode;
    [...seg.children].forEach(x => x.classList.toggle('active', x === b));
    $('#time-group').classList.toggle('hidden', mode !== 'time');
    $('#words-group').classList.toggle('hidden', mode !== 'words');
    saveSettings();
  });

  document.querySelectorAll('.opts').forEach(grp => {
    grp.addEventListener('click', e => {
      const o = e.target.closest('.opt'); if (!o) return;
      [...grp.children].forEach(x => x.classList.toggle('active', x === o));
      const t = grp.dataset.target;
      if (t === 'time') timeVal = +o.dataset.val;
      else if (t === 'words') wordVal = +o.dataset.val;
      else if (t === 'grace') graceMs = +o.dataset.val * 1000;
      saveSettings();
    });
  });

  $('#hardcore-toggle').addEventListener('change', e => { hardcore = e.target.checked; saveSettings(); });
  $('#typewriter-toggle').addEventListener('change', e => { typewriter = e.target.checked; saveSettings(); });

  // ---- Options expander ----
  const optToggle = $('#options-toggle');
  optToggle.addEventListener('click', () => {
    const open = $('#options-panel').classList.toggle('hidden') === false;
    optToggle.classList.toggle('open', open);
  });

  // ---- Theme & font ---- (both live in the Options "Visual settings" section)
  const themeSeg = $('#theme-seg');
  function updateThemeUI() {
    [...themeSeg.children].forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
  }
  function setTheme(t) {
    theme = t;
    applyTheme();
    updateThemeUI();
    saveSettings();
  }
  themeSeg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    setTheme(b.dataset.theme);
  });
  const fontSeg = $('#font-seg');
  fontSeg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    font = b.dataset.font;
    [...fontSeg.children].forEach(x => x.classList.toggle('active', x === b));
    applyFont();
    saveSettings();
  });

  // ---- Prompt picker (in modal) ----
  const CAT_LABELS = { freewrite: 'Random', fiction: 'Fiction', journal: 'Journal' };
  const promptSeg = $('#prompt-seg');
  const promptTrigger = $('#prompt-trigger');

  function refreshTrigger() {
    if (promptCat === 'none') {
      promptTrigger.textContent = '✨ Need a prompt?';
      promptTrigger.classList.remove('set');
    } else {
      promptTrigger.textContent = '✨ Prompt: ' + CAT_LABELS[promptCat];
      promptTrigger.classList.add('set');
    }
  }

  promptSeg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    promptCat = b.dataset.cat;
    [...promptSeg.children].forEach(x => x.classList.toggle('active', x === b));
    newPrompt();
    const box = $('#prompt-box');
    box.classList.toggle('hidden', promptCat === 'none');
    if (promptText) $('#prompt-text').textContent = promptText;
    saveSettings();
  });
  $('#prompt-shuffle').addEventListener('click', () => {
    newPrompt();
    $('#prompt-text').textContent = promptText;
  });

  const promptModal = $('#prompt-modal');
  const closeModal = () => { promptModal.classList.add('hidden'); refreshTrigger(); };
  promptTrigger.addEventListener('click', () => promptModal.classList.remove('hidden'));
  $('#prompt-done').addEventListener('click', closeModal);
  promptModal.addEventListener('click', e => { if (e.target === promptModal) closeModal(); });
  // ---- Progress / stats modal ----
  const statsModal = $('#stats-modal');
  const closeStats = () => statsModal.classList.add('hidden');
  function cell(num, cap) {
    return '<div class="stat-cell"><div class="num">' + num + '</div><div class="cap">' + cap + '</div></div>';
  }
  function renderStats() {
    const hist = loadHistory();
    const s = computeStats(hist);
    const winLabel = n => n + (n === 1 ? ' win' : ' wins');
    $('#stats-grid').innerHTML =
      cell(s.totalWords.toLocaleString(), 'words written') +
      cell(s.wins + ' / ' + s.total, 'sessions kept') +
      cell(winLabel(s.current), 'current streak') +
      cell(winLabel(s.best), 'best streak');
    const list = $('#hist-list');
    if (!hist.length) {
      list.innerHTML = '<div class="hist-empty">No sessions yet — go get some words out.</div>';
      return;
    }
    list.innerHTML = hist.slice().reverse().slice(0, 12).map(e => {
      const goal = e.goalType === 'time' ? (e.goalVal + ' min') : (e.goalVal + ' words');
      const res = e.won
        ? '<span class="res win">✓ ' + e.words + 'w</span>'
        : '<span class="res loss">✗ cleared</span>';
      return '<div class="hist-row"><span class="when">' + fmtWhen(e.t) + '</span>' +
             '<span class="goal">' + goal + '</span>' + res + '</div>';
    }).join('');
  }
  function openStats() { renderStats(); statsModal.classList.remove('hidden'); }
  $('#stats-done').addEventListener('click', closeStats);
  statsModal.addEventListener('click', e => { if (e.target === statsModal) closeStats(); });
  $('#end-progress-btn').addEventListener('click', openStats);

  // discreet progress entry under the Begin button
  const progressSummary = $('#progress-summary');
  function refreshProgressSummary() {
    const s = computeStats(loadHistory());
    if (!s.total) {
      progressSummary.textContent = '📊 Your progress will appear here';
    } else if (s.current > 1) {
      progressSummary.textContent = '🔥 ' + s.current + ' in a row · ' + s.totalWords.toLocaleString() + ' words written';
    } else {
      progressSummary.textContent = '📊 ' + s.totalWords.toLocaleString() + ' words written · see progress';
    }
  }
  progressSummary.addEventListener('click', openStats);

  // ---- Confetti celebration ----
  const confettiCanvas = $('#confetti');
  const cctx = confettiCanvas.getContext('2d');
  let confettiRaf = 0;
  function celebrate() {
    const W = confettiCanvas.width = window.innerWidth;
    const H = confettiCanvas.height = window.innerHeight;
    confettiCanvas.style.display = 'block';
    const cs = getComputedStyle(document.body);
    const v = n => cs.getPropertyValue(n).trim();
    const colors = [v('--accent'), v('--warn'), v('--ink'), v('--ok')];
    const parts = [];
    for (let i = 0; i < 150; i++) {
      parts.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.4,
        vx: (Math.random() - 0.5) * 6,
        vy: 3 + Math.random() * 5,
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    const startT = performance.now();
    const DURATION = 2800;
    function frame(now) {
      const elapsed = now - startT;
      cctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.12; // gravity
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y < H + 20) alive = true;
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);
        cctx.fillStyle = p.color;
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        cctx.restore();
      }
      if (elapsed < DURATION && alive) {
        confettiRaf = requestAnimationFrame(frame);
      } else {
        cctx.clearRect(0, 0, W, H);
        confettiCanvas.style.display = 'none';
      }
    }
    cancelAnimationFrame(confettiRaf);
    confettiRaf = requestAnimationFrame(frame);
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!promptModal.classList.contains('hidden')) closeModal();
    else if (!statsModal.classList.contains('hidden')) closeStats();
  });

  // ---- Restore persisted settings ----
  function loadSettings() {
    let s;
    try { s = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return; }
    if (!s || typeof s !== 'object') return;

    if (s.mode === 'time' || s.mode === 'words') {
      mode = s.mode;
      [...seg.children].forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
      $('#time-group').classList.toggle('hidden', mode !== 'time');
      $('#words-group').classList.toggle('hidden', mode !== 'words');
    }
    if (typeof s.timeVal === 'number') { timeVal = s.timeVal; setActiveOpt('time', timeVal); }
    if (typeof s.wordVal === 'number') { wordVal = s.wordVal; setActiveOpt('words', wordVal); }
    if (typeof s.graceMs === 'number') { graceMs = s.graceMs; setActiveOpt('grace', graceMs / 1000); }
    if (typeof s.hardcore === 'boolean') { hardcore = s.hardcore; $('#hardcore-toggle').checked = hardcore; }
    if (typeof s.typewriter === 'boolean') { typewriter = s.typewriter; $('#typewriter-toggle').checked = typewriter; }
    if (s.promptCat === 'none' || PROMPTS[s.promptCat]) {
      promptCat = s.promptCat;
      [...promptSeg.children].forEach(b => b.classList.toggle('active', b.dataset.cat === promptCat));
      if (promptCat !== 'none') {
        newPrompt();
        $('#prompt-box').classList.remove('hidden');
        $('#prompt-text').textContent = promptText;
      }
      refreshTrigger();
    }
    if (['dark', 'sepia', 'light'].includes(s.theme)) {
      theme = s.theme;
    }
    if (['serif', 'sans', 'mono'].includes(s.font)) {
      font = s.font;
      [...fontSeg.children].forEach(b => b.classList.toggle('active', b.dataset.font === font));
    }
  }
  migrateStorage();
  loadSettings();
  applyTheme();
  applyFont();
  updateThemeUI();
  refreshProgressSummary();

  // ---- Session state ----
  let lastKey = 0, startTime = 0, raf = 0, finished = false, started = false, overtime = false;
  const editor = $('#editor');
  const decay = $('#decay');
  const flash = $('#flash');

  function countWords(t) {
    const m = t.trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  // ---- Typewriter scrolling ----
  // An off-screen clone mirrors the text up to the caret so we can read its
  // pixel offset, then we scroll the editor to keep that line centred.
  let mirror = null;
  const MIRROR_PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
    'lineHeight', 'letterSpacing', 'textTransform', 'paddingTop', 'paddingBottom',
    'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth', 'boxSizing'];
  function centerCaret() {
    if (!typewriter) return;
    if (!mirror) { mirror = document.createElement('div'); mirror.id = 'editor-mirror'; document.body.appendChild(mirror); }
    const cs = getComputedStyle(editor);
    MIRROR_PROPS.forEach(p => { mirror.style[p] = cs[p]; });
    mirror.style.width = editor.clientWidth + 'px';
    mirror.textContent = editor.value.slice(0, editor.selectionStart);
    const marker = document.createElement('span');
    marker.textContent = '​'; // zero-width space at the caret
    mirror.appendChild(marker);
    const caretY = marker.offsetTop + marker.offsetHeight / 2;
    editor.scrollTop = caretY - editor.clientHeight / 2;
  }

  function start() {
    finished = false;
    overtime = false;
    $('#quit-btn').textContent = 'Stop';
    document.body.classList.toggle('hardcore', hardcore);
    document.body.classList.toggle('typewriter', typewriter);
    editor.value = '';
    $('#setup-screen').classList.add('hidden');
    $('#end-screen').classList.add('hidden');
    $('#write-screen').classList.remove('hidden');
    const wp = $('#write-prompt');
    if (promptCat !== 'none' && promptText) {
      wp.textContent = promptText;
      wp.classList.remove('hidden');
    } else {
      wp.classList.add('hidden');
    }
    editor.focus();
    centerCaret();
    // Armed, but nothing counts down until the first keystroke.
    started = false;
    startTime = lastKey = 0;
    document.body.classList.add('armed');
    if (mode === 'time') $('#goalflash').textContent = 'Goal: ' + timeVal + ' min';
    else $('#goalflash').textContent = 'Goal: ' + wordVal + ' words';
    loop();
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!started) {
      // waiting for the first keystroke — momentum stays full, clock paused
      decay.style.transform = 'scaleX(1)';
      if (mode === 'time') {
        const s = timeVal * 60;
        $('#progress').innerHTML = '<strong>' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + '</strong> left';
      } else {
        $('#progress').innerHTML = '<strong>0</strong> / ' + wordVal + ' words';
      }
      return;
    }
    if (overtime) {
      // goal reached — the page can't clear anymore, just keep the count live
      decay.style.transform = 'scaleX(1)';
      $('#progress').innerHTML = '<strong>' + countWords(editor.value) + '</strong> words — keep going';
      return;
    }
    const now = performance.now();
    const idle = now - lastKey;
    const remain = Math.max(0, graceMs - idle);
    const frac = remain / graceMs;

    // decay bar shrinks as idle grows
    decay.style.transform = 'scaleX(' + frac + ')';
    document.body.classList.toggle('low', frac < 0.45);

    // HUD progress
    if (mode === 'time') {
      const left = Math.max(0, timeVal * 60000 - (now - startTime));
      const s = Math.ceil(left / 1000);
      $('#progress').innerHTML = '<strong>' + String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0') + '</strong> left';
      if (left <= 0) return win();
    } else {
      const w = countWords(editor.value);
      $('#progress').innerHTML = '<strong>' + w + '</strong> / ' + wordVal + ' words';
      if (w >= wordVal) return win();
    }

    if (idle >= graceMs) return lose();
  }

  function onType(e) {
    if (finished) return;
    if (!started) { started = true; startTime = performance.now(); document.body.classList.remove('armed'); }
    lastKey = performance.now();
    if (hardcore) {
      const ch = (e.data && e.data.trim()) ? e.data : (e.inputType === 'insertLineBreak' ? '↵' : '·');
      flash.textContent = ch;
    }
    centerCaret();
  }
  editor.addEventListener('input', onType);

  function stop() { cancelAnimationFrame(raf); document.body.classList.remove('low', 'armed', 'done'); }

  // Goal reached → "overtime": stay in the editor, celebrate in place, and let
  // the writer keep typing for as long as they like. The win is logged right
  // away (so it counts even if they close the tab) and the entry is updated
  // with the final word count when they hit Finish.
  const winNote = $('#win-note');
  let winNoteT = 0;
  function win() {
    if (finished || overtime) return;
    overtime = true;
    recordSession(true, countWords(editor.value), performance.now() - startTime);
    document.body.classList.remove('low');
    document.body.classList.add('done');
    $('#goalflash').textContent = 'Goal reached 🎉';
    $('#quit-btn').textContent = 'Finish ✓';
    winNote.classList.remove('hidden');
    clearTimeout(winNoteT);
    winNoteT = setTimeout(() => winNote.classList.add('hidden'), 6500);
    celebrate();
  }
  function updateLastSession(words, durationMs) {
    const hist = loadHistory();
    const last = hist[hist.length - 1];
    if (last && last.won) {
      last.words = words;
      last.durationMs = Math.round(durationMs);
      try { localStorage.setItem(HIST_KEY, JSON.stringify(hist)); } catch (e) { /* ignore */ }
    }
  }
  function finish() {
    if (finished) return; finished = true; stop();
    clearTimeout(winNoteT);
    winNote.classList.add('hidden');
    const text = editor.value;
    const dur = performance.now() - startTime;
    updateLastSession(countWords(text), dur);
    window.__savedMeta = { prompt: promptText, when: Date.now(), durationMs: dur };
    showEnd(true, text);
  }
  function lose() {
    if (finished) return; finished = true; stop();
    recordSession(false, countWords(editor.value), performance.now() - startTime);
    editor.value = '';
    showEnd(false, '');
  }

  function showEnd(won, text) {
    document.body.classList.remove('hardcore', 'typewriter');
    $('#write-screen').classList.add('hidden');
    const card = $('#end-card');
    card.classList.toggle('win', won);
    card.classList.toggle('lose', !won);
    if (won) {
      $('#end-title').textContent = 'You got it out! 🎉';
      $('#end-msg').textContent = countWords(text) + ' words — all yours. Save them before you go.';
      $('#preview').style.display = '';
      $('#preview').textContent = text;
      $('#copy-btn').style.display = '';
      $('#download-btn').style.display = '';
      $('#download-md-btn').style.display = '';
      window.__saved = text;
      const cur = computeStats(loadHistory()).current;
      const streak = $('#end-streak');
      streak.textContent = cur > 1 ? '🔥 ' + cur + ' in a row!' : 'First one down — keep it going.';
      streak.classList.remove('hidden');
    } else {
      $('#end-streak').classList.add('hidden');
      $('#end-title').textContent = 'The page cleared.';
      $('#end-msg').textContent = 'You paused a little too long, so the page reset — no harm done. Momentum matters more than any single sentence. Ready to go again?';
      $('#preview').style.display = 'none';
      $('#copy-btn').style.display = 'none';
      $('#download-btn').style.display = 'none';
      $('#download-md-btn').style.display = 'none';
    }
    $('#end-screen').classList.remove('hidden');
  }

  // ---- Buttons ----
  $('#start-btn').addEventListener('click', start);
  $('#again-btn').addEventListener('click', () => {
    $('#end-screen').classList.add('hidden');
    refreshProgressSummary();
    $('#setup-screen').classList.remove('hidden');
  });
  $('#quit-btn').addEventListener('click', () => {
    if (finished) return;
    if (overtime) return finish();
    if (!started) {
      // never began — slip back to setup, record nothing
      stop();
      document.body.classList.remove('hardcore', 'typewriter');
      $('#write-screen').classList.add('hidden');
      refreshProgressSummary();
      $('#setup-screen').classList.remove('hidden');
      return;
    }
    lose();
  });
  $('#copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.__saved || '').then(() => {
      $('#copy-btn').textContent = 'Copied!';
      setTimeout(() => $('#copy-btn').textContent = 'Copy text', 1400);
    });
  });
  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type: type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function sessionFileName(ext) {
    const d = new Date((window.__savedMeta || {}).when || Date.now());
    const p = n => String(n).padStart(2, '0');
    const stamp = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      '-' + p(d.getHours()) + p(d.getMinutes());
    return 'LetItOut_writing_session_' + stamp + '.' + ext;
  }
  function buildMarkdown(text, meta) {
    const d = new Date(meta.when || Date.now());
    const date = MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    const mins = Math.round((meta.durationMs || 0) / 60000);
    const lines = ['# Writing session — ' + date, ''];
    if (meta.prompt) lines.push('> ' + meta.prompt, '');
    lines.push('*' + countWords(text) + ' words · ' + (mins < 1 ? '<1' : mins) + ' min*', '', text.trim(), '');
    return lines.join('\n');
  }
  $('#download-btn').addEventListener('click', () =>
    downloadFile(sessionFileName('txt'), window.__saved || '', 'text/plain'));
  $('#download-md-btn').addEventListener('click', () =>
    downloadFile(sessionFileName('md'), buildMarkdown(window.__saved || '', window.__savedMeta || {}), 'text/markdown'));

  // warn before accidental nav loss mid-session
  window.addEventListener('beforeunload', e => {
    if (!finished && !$('#write-screen').classList.contains('hidden')) { e.preventDefault(); e.returnValue = ''; }
  });
})();
