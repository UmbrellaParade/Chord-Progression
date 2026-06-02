let state = {
  preset: PRESETS[0],
  key: 'C',
  mode: 'guitar',
  selectedDegree: null,
  selectedInversion: 0,
  view: 'chords',            // 'chords' | 'scales'
  scaleCategory: 'mode',
  scale: SCALES[0],
};

function init() {
  renderPresets();
  renderKeys();
  renderProgression();
  renderScaleCategories();
  renderScaleButtons();

  document.getElementById('randomKey').addEventListener('click', () => {
    const idx = Math.floor(Math.random() * KEYS.length);
    setKey(KEYS[idx]);
  });
  document.getElementById('modeGuitar').addEventListener('click', () => setMode('guitar'));
  document.getElementById('modePiano').addEventListener('click', () => setMode('piano'));

  document.querySelectorAll('.main-tab').forEach(tab => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });
}

function setView(v) {
  state.view = v;
  document.querySelectorAll('.main-tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  document.getElementById('chordsView').style.display  = v === 'chords' ? '' : 'none';
  document.getElementById('scalesView').style.display  = v === 'scales' ? '' : 'none';
  document.getElementById('presetGroup').style.display         = v === 'chords' ? '' : 'none';
  document.getElementById('scaleCategoryGroup').style.display  = v === 'scales' ? '' : 'none';
  document.getElementById('scaleSelectGroup').style.display    = v === 'scales' ? '' : 'none';
  if (v === 'scales') renderScaleDisplay();
}

function renderPresets() {
  const container = document.getElementById('presetButtons');
  container.innerHTML = '';
  PRESETS.forEach((p, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'preset-item';

    const btn = document.createElement('button');
    btn.className = 'btn-preset' + (p.id === state.preset.id ? ' active' : '');
    btn.innerHTML = `<span class="preset-num">${i + 1}</span>${p.name}`;
    btn.title = p.desc;
    btn.addEventListener('click', () => {
      state.preset = p;
      state.selectedDegree = null;
      state.selectedInversion = 0;
      renderPresets();
      renderProgression();
      clearDetail();
    });
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}

function renderKeys() {
  const container = document.getElementById('keyButtons');
  container.innerHTML = '';
  KEYS.forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'btn-key' + (k === state.key ? ' active' : '');
    btn.textContent = k;
    btn.addEventListener('click', () => setKey(k));
    container.appendChild(btn);
  });
}

function setKey(k) {
  state.key = k;
  state.selectedDegree = null;
  state.selectedInversion = 0;
  renderKeys();
  if (state.view === 'chords') {
    renderProgression();
    clearDetail();
  } else {
    renderScaleDisplay();
  }
}

function setMode(m) {
  state.mode = m;
  document.querySelectorAll('.toggle').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  if (state.view === 'chords') {
    if (state.selectedDegree !== null) showDetail(state.selectedDegree, state.selectedInversion);
  } else {
    renderScaleDisplay();
  }
}

function renderProgression() {
  const container = document.getElementById('progressionDisplay');
  container.innerHTML = '';

  const descEl = document.createElement('p');
  descEl.className = 'preset-desc';
  descEl.textContent = state.preset.desc;
  container.appendChild(descEl);

  const cardsRow = document.createElement('div');
  cardsRow.className = 'cards-row';

  state.preset.degrees.forEach((degIdx, i) => {
    const chordName = getChordName(state.key, degIdx, false);
    const degreeName = DEGREE_NAMES[degIdx];
    const quality = DIATONIC_QUALITY[degIdx];
    const fn = FUNCTION_LABELS[degreeName];
    const romanDegree = quality === 'min' || quality === 'dim'
      ? degreeName.toLowerCase()
      : degreeName;

    const card = document.createElement('div');
    card.className = 'chord-card' + (state.selectedDegree === i ? ' selected' : '');
    card.innerHTML = `
      <div class="fn-label" style="color:${fn.color}">${fn.label}</div>
      <div class="degree">${romanDegree}${quality === 'dom' ? '7' : quality === 'dim' ? '°' : ''}</div>
      <div class="chord-name">${chordName}</div>
    `;
    card.addEventListener('click', () => {
      state.selectedDegree = i;
      state.selectedInversion = 0;
      document.querySelectorAll('.chord-card').forEach((c, idx) =>
        c.classList.toggle('selected', idx === i));
      showDetail(i, 0);
    });
    cardsRow.appendChild(card);

    if (i < state.preset.degrees.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'arrow';
      arrow.textContent = '→';
      cardsRow.appendChild(arrow);
    }
  });

  container.appendChild(cardsRow);
}

function showDetail(cardIndex, inversionIndex) {
  state.selectedDegree = cardIndex;
  state.selectedInversion = inversionIndex;
  const degIdx = state.preset.degrees[cardIndex];
  const chordName = getChordName(state.key, degIdx, false);
  const inversions = getChordInversions(state.key, degIdx);
  const currentInv = inversions[inversionIndex];
  const panel = document.getElementById('detailPanel');

  // Inversion tabs
  const tabsHTML = inversions.map((inv, i) => `
    <button class="inv-tab${i === inversionIndex ? ' active' : ''}" data-inv="${i}">
      <span class="inv-tab-name">${inv.name}</span>
      <span class="inv-tab-notes">${inv.notes.join('-')}</span>
    </button>
  `).join('');

  // Bass note annotation for non-root inversions
  const bassLabel = inversionIndex > 0
    ? `<span class="bass-label">${chordName}/${currentInv.bassNote}</span>`
    : '';

  let instrumentHTML = '';
  if (state.mode === 'guitar') {
    instrumentHTML = renderGuitarDiagram(chordName, inversionIndex, currentInv);
  } else {
    instrumentHTML = renderPianoKeys(currentInv.notes, currentInv.bassNote);
  }

  panel.innerHTML = `
    <div class="detail-header">
      <span class="detail-chord">${chordName}</span>
      ${bassLabel}
    </div>
    <div class="inv-tabs">${tabsHTML}</div>
    ${instrumentHTML}
  `;

  panel.querySelectorAll('.inv-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      showDetail(cardIndex, parseInt(btn.dataset.inv));
    });
  });
}

function clearDetail() {
  document.getElementById('detailPanel').innerHTML = '<p class="detail-hint">コードをクリックして詳細を表示</p>';
}

// ---- Guitar Diagram ----
function renderGuitarDiagram(chordName, inversionIndex, invData) {
  const voicing = getGuitarVoicing(chordName, inversionIndex ?? 0);
  if (!voicing) {
    return `<div class="no-voicing">ダイアグラムなし (${chordName})</div>`;
  }

  const { frets, barre } = voicing;
  const bassNote = invData ? invData.bassNote : null;

  // Find which string index is the bass (lowest non-null string, leftmost = index 0 = lowE)
  const bassStringIdx = frets.findIndex(f => f !== null);

  const activeFrets = frets.filter(f => f !== null && f > 0);
  const minFret = activeFrets.length ? Math.min(...activeFrets) : 1;
  const displayMin = barre ? barre : Math.max(1, minFret);
  const fretRange = 4;

  const strings = 6;
  const cellW = 36, cellH = 36, padding = 32;
  const svgW = (strings - 1) * cellW + padding * 2;
  const svgH = fretRange * cellH + padding * 2 + 20;

  let svg = `<svg class="guitar-diagram" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`;

  // Nut or fret indicator
  if (displayMin === 1) {
    svg += `<line x1="${padding}" y1="${padding}" x2="${padding + (strings-1)*cellW}" y2="${padding}" stroke="#e2e8f0" stroke-width="4"/>`;
  } else {
    svg += `<text x="${padding - 4}" y="${padding + cellH * 0.6}" text-anchor="end" fill="#94a3b8" font-size="12">${displayMin}fr</text>`;
  }

  // Fret lines
  for (let f = 0; f <= fretRange; f++) {
    const y = padding + f * cellH;
    svg += `<line x1="${padding}" y1="${y}" x2="${padding + (strings-1)*cellW}" y2="${y}" stroke="#334155" stroke-width="1"/>`;
  }

  // String lines — bass string gets highlight color
  for (let s = 0; s < strings; s++) {
    const x = padding + s * cellW;
    const isBassString = s === bassStringIdx;
    svg += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${padding + fretRange*cellH}" stroke="${isBassString ? '#f59e0b' : '#475569'}" stroke-width="${isBassString ? 2.5 : 1.5}"/>`;
  }

  // Barre bar
  if (barre) {
    const y = padding + (barre - displayMin + 0.5) * cellH;
    svg += `<rect x="${padding - 8}" y="${y - 10}" width="${(strings-1)*cellW + 16}" height="20" rx="10" fill="#6366f1" opacity="0.85"/>`;
  }

  // Dots
  frets.forEach((f, i) => {
    const x = padding + (strings - 1 - i) * cellW;
    const isBassStr = i === bassStringIdx;
    if (f === null) {
      svg += `<text x="${x}" y="${padding - 12}" text-anchor="middle" fill="#ef4444" font-size="14">✕</text>`;
    } else if (f === 0) {
      svg += `<circle cx="${x}" cy="${padding - 12}" r="6" fill="none" stroke="${isBassStr ? '#f59e0b' : '#94a3b8'}" stroke-width="2"/>`;
      if (isBassStr && bassNote) {
        svg += `<text x="${x}" y="${padding - 22}" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="bold">${bassNote}</text>`;
      }
    } else {
      const y = padding + (f - displayMin + 0.5) * cellH;
      if (!barre || f !== barre) {
        const dotColor = isBassStr ? '#f59e0b' : '#6366f1';
        svg += `<circle cx="${x}" cy="${y}" r="10" fill="${dotColor}"/>`;
        if (isBassStr && bassNote) {
          svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${bassNote}</text>`;
        }
      }
    }
  });

  // String labels at bottom (low E to high E)
  const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
  STRING_NAMES.forEach((name, i) => {
    if (frets[i] === null) return;
    const x = padding + (strings - 1 - i) * cellW;
    svg += `<text x="${x}" y="${padding + fretRange*cellH + 16}" text-anchor="middle" fill="#475569" font-size="10">${name}</text>`;
  });

  svg += '</svg>';

  const posLabel = voicing.pos && voicing.pos !== 'Open' ? `<span class="diagram-pos">${voicing.pos}</span>` : '';
  return `<div class="diagram-wrap">${svg}${posLabel}</div>`;
}

// ---- Piano Keys ----
const ENHARMONIC = { 'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#' };

// White key positions within an octave (0-6)
const WHITE_POS = { 'C':0,'D':1,'E':2,'F':3,'G':4,'A':5,'B':6 };
const BLACK_POS = { 'C#':0.6,'D#':1.6,'F#':3.6,'G#':4.6,'A#':5.6 };
const IS_BLACK  = new Set(['C#','D#','F#','G#','A#']);

function renderPianoKeys(chordNotes, bassNote) {
  // Build ordered note list with octave info for the inversion voicing
  // Bass note goes in octave 4, subsequent notes go up
  const normNotes = chordNotes.map(n => ENHARMONIC[n] || n);
  const bassNorm  = ENHARMONIC[bassNote] || bassNote;

  // Assign octaves: start bass at octave 4, each next note goes to same or next octave
  const noteOctaves = [];
  let octave = 4;
  normNotes.forEach((note, i) => {
    if (i === 0) {
      noteOctaves.push({ note, octave });
    } else {
      const prevNote = normNotes[i - 1];
      const prevPos  = IS_BLACK.has(prevNote) ? BLACK_POS[prevNote] : WHITE_POS[prevNote];
      const curPos   = IS_BLACK.has(note)     ? BLACK_POS[note]     : WHITE_POS[note];
      if (curPos <= prevPos) octave++;   // wrapped around → next octave
      noteOctaves.push({ note, octave });
    }
  });

  // Display range: from bass octave to highest note octave (+ a little padding)
  const minOct = noteOctaves[0].octave;
  const maxOct = noteOctaves[noteOctaves.length - 1].octave;
  const startOct = minOct;
  const endOct   = maxOct + 1;
  const numOcts  = endOct - startOct;

  const kw = 34, kh = 110, bkw = 22, bkh = 68;
  const totalW = numOcts * 7 * kw;

  // Build a set of (note, octave) pairs that are active
  const activeSet = new Set(noteOctaves.map(n => `${n.note}${n.octave}`));
  const bassKey   = `${bassNorm}${minOct}`;

  let whites = '', blacks = '';

  for (let oct = startOct; oct < endOct; oct++) {
    const octOffset = (oct - startOct) * 7;
    // White keys
    ['C','D','E','F','G','A','B'].forEach((note, wi) => {
      const key   = `${note}${oct}`;
      const isAct = activeSet.has(key);
      const isBas = key === bassKey;
      const fill  = isBas ? '#f59e0b' : isAct ? '#818cf8' : '#f1f5f9';
      const xi    = (octOffset + wi) * kw;
      whites += `<rect x="${xi}" y="0" width="${kw-2}" height="${kh}" rx="3" fill="${fill}" stroke="#334155" stroke-width="1"/>`;
      if (isAct) {
        whites += `<text x="${xi+kw/2-1}" y="${kh-10}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${note}</text>`;
        if (isBas) whites += `<text x="${xi+kw/2-1}" y="${kh-24}" text-anchor="middle" fill="white" font-size="9">ベース</text>`;
      }
      // Octave marker at C
      if (note === 'C') {
        whites += `<text x="${xi+kw/2-1}" y="${kh+14}" text-anchor="middle" fill="#475569" font-size="9">C${oct}</text>`;
      }
    });
    // Black keys
    Object.entries(BLACK_POS).forEach(([note, offset]) => {
      const key   = `${note}${oct}`;
      const isAct = activeSet.has(key);
      const isBas = key === bassKey;
      const fill  = isBas ? '#f59e0b' : isAct ? '#818cf8' : '#1e293b';
      const xi    = (octOffset + offset) * kw - bkw/2;
      blacks += `<rect x="${xi}" y="0" width="${bkw}" height="${bkh}" rx="2" fill="${fill}" stroke="#0f172a" stroke-width="1"/>`;
      if (isAct) {
        blacks += `<text x="${xi+bkw/2}" y="${bkh-6}" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${note.replace('#','♯')}</text>`;
      }
    });
  }

  // Voicing note order arrows
  const arrowNotes = noteOctaves.map(({note, octave: o}) => {
    const isBk = IS_BLACK.has(note);
    const pos  = isBk ? BLACK_POS[note] : WHITE_POS[note];
    const xCenter = ((o - startOct) * 7 + pos) * kw + (isBk ? 0 : kw/2 - 1);
    const yPos    = isBk ? bkh/2 : kh/2;
    return { note, xCenter, yPos, isBass: note === bassNorm && o === minOct };
  });

  return `
    <div class="piano-wrap">
      <svg width="${totalW}" height="${kh+20}" viewBox="0 0 ${totalW} ${kh+20}" class="piano-svg">
        ${whites}${blacks}
      </svg>
      <div class="piano-voicing">
        ${arrowNotes.map((n, i) =>
          `<span class="pv-note${n.isBass ? ' pv-bass' : ''}">${n.note}${n.isBass ? '<sup>低</sup>' : ''}</span>${i < arrowNotes.length-1 ? '<span class="pv-arrow">→</span>' : ''}`
        ).join('')}
      </div>
      <div class="piano-legend">
        <span class="legend-item"><span class="legend-dot" style="background:#818cf8"></span>構成音</span>
        <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>ベース音</span>
      </div>
    </div>`;
}

// =====================================================
// ---- Scale Section ----
// =====================================================

function renderScaleCategories() {
  const container = document.getElementById('scaleCategoryButtons');
  container.innerHTML = '';
  SCALE_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'btn-preset' + (cat.id === state.scaleCategory ? ' active' : '');
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      state.scaleCategory = cat.id;
      const first = SCALES.find(s => s.category === cat.id);
      if (first) state.scale = first;
      renderScaleCategories();
      renderScaleButtons();
      renderScaleDisplay();
    });
    container.appendChild(btn);
  });
}

function renderScaleButtons() {
  const container = document.getElementById('scaleButtons');
  container.innerHTML = '';
  SCALES.filter(s => s.category === state.scaleCategory).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'btn-preset' + (s.id === state.scale.id ? ' active' : '');
    btn.innerHTML = `<span style="color:${s.color};font-size:0.7em">●</span> ${s.name}`;
    btn.title = s.nameEn;
    btn.addEventListener('click', () => {
      state.scale = s;
      renderScaleButtons();
      renderScaleDisplay();
    });
    container.appendChild(btn);
  });
}

function renderScaleDisplay() {
  const panel = document.getElementById('scaleDisplay');
  const { scale, key, mode } = state;
  const notes = getScaleNotes(key, scale.intervals);
  const rootNote = notes[0];

  const degreeRows = scale.degrees.map((deg, i) => `
    <div class="scale-degree-row">
      <span class="sd-deg" style="color:${i === 0 ? '#f59e0b' : scale.color}">${deg}</span>
      <span class="sd-note${i === 0 ? ' sd-root' : ''}">${notes[i]}</span>
    </div>
  `).join('');

  const instrument = mode === 'guitar'
    ? renderScaleFretboard(key, scale.intervals, scale.color)
    : renderScalePianoFull(notes, rootNote, scale.color);

  panel.innerHTML = `
    <div class="scale-header">
      <span class="scale-title" style="color:${scale.color}">${scale.name}</span>
      <span class="scale-title-en">${scale.nameEn}</span>
      <span class="scale-key-badge">${key}</span>
    </div>
    <p class="scale-desc">${scale.desc}</p>
    <div class="scale-use">使用ジャンル: <strong>${scale.use}</strong></div>

    <div class="scale-body">
      <div class="scale-degrees">${degreeRows}</div>
      <div class="scale-instrument">${instrument}</div>
    </div>

    <div class="scale-notes-row">
      ${notes.map((n, i) => `
        <div class="scale-note-chip${i === 0 ? ' root' : ''}" style="${i === 0 ? '' : `border-color:${scale.color}40`}">
          <span class="snc-deg">${scale.degrees[i]}</span>
          <span class="snc-note">${n}</span>
        </div>
      `).join('<span class="scale-note-sep">·</span>')}
    </div>
  `;
}

// ---- Scale Fretboard ----
// String tuning: low E to high E in semitones from C
const FRET_TUNING = [4, 9, 2, 7, 11, 4]; // E A D G B e
const FRET_STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

function renderScaleFretboard(key, intervals, accentColor) {
  const rootSemi = CHROMATIC.indexOf(keyToChromatic(key));
  const scaleSet  = new Set(intervals.map(i => (rootSemi + i) % 12));

  const FRETS = 12;
  const fw = 40, fh = 30;
  const padL = 28, padT = 24, padB = 22;
  const totalW = padL + FRETS * fw;
  const totalH = padT + 5 * fh + padB;

  let svg = `<svg class="scale-fretboard" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`;

  // Fret position markers (3, 5, 7, 9, 12)
  [3,5,7,9,12].forEach(f => {
    const x = padL + (f - 0.5) * fw;
    const y = totalH - padB + 6;
    svg += `<text x="${x}" y="${y}" text-anchor="middle" fill="#475569" font-size="10">${f}</text>`;
    // faint dot marker between strings 3 and 4
    if (f !== 12) {
      svg += `<circle cx="${x}" cy="${padT + 2.5 * fh}" r="4" fill="#1e293b"/>`;
    } else {
      // double dot at 12
      svg += `<circle cx="${x}" cy="${padT + 1.5 * fh}" r="4" fill="#1e293b"/>`;
      svg += `<circle cx="${x}" cy="${padT + 3.5 * fh}" r="4" fill="#1e293b"/>`;
    }
  });

  // Nut
  svg += `<rect x="${padL - 3}" y="${padT}" width="4" height="${5 * fh}" rx="2" fill="#94a3b8"/>`;

  // Fret lines
  for (let f = 1; f <= FRETS; f++) {
    const x = padL + f * fw;
    svg += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + 5 * fh}" stroke="#334155" stroke-width="1"/>`;
  }

  // String lines + labels
  for (let s = 0; s < 6; s++) {
    const y = padT + s * fh;
    const thickness = 1 + (5 - s) * 0.4;
    svg += `<line x1="${padL}" y1="${y}" x2="${totalW}" y2="${y}" stroke="#475569" stroke-width="${thickness}"/>`;
    svg += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="10">${FRET_STRING_NAMES[s]}</text>`;
  }

  // Note dots
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= FRETS; f++) {
      const noteSemi = (FRET_TUNING[s] + f) % 12;
      if (!scaleSet.has(noteSemi)) continue;
      const isRoot = noteSemi === rootSemi;
      const cx = f === 0 ? padL - 16 : padL + (f - 0.5) * fw;
      const cy = padT + s * fh;
      const dotColor = isRoot ? '#f59e0b' : accentColor;
      svg += `<circle cx="${cx}" cy="${cy}" r="11" fill="${dotColor}" opacity="0.92"/>`;
      let noteName = CHROMATIC[noteSemi];
      if (FLAT_KEYS.has(state.key) && FLAT_NAMES[noteName]) noteName = FLAT_NAMES[noteName];
      const fontSize = noteName.length > 2 ? 7 : 9;
      svg += `<text cx="${cx}" cy="${cy}" x="${cx}" y="${cy + 3}" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold">${noteName}</text>`;
    }
  }

  svg += '</svg>';

  return `<div class="fretboard-wrap">
    <div class="fretboard-legend">
      <span class="fb-legend-item"><span class="fb-dot" style="background:#f59e0b"></span>ルート音</span>
      <span class="fb-legend-item"><span class="fb-dot" style="background:${accentColor}"></span>スケール音</span>
    </div>
    <div style="overflow-x:auto">${svg}</div>
  </div>`;
}

// ---- Scale Piano (full 2-octave) ----
function renderScalePianoFull(scaleNotes, rootNote, accentColor) {
  const highlighted = new Set(scaleNotes.map(n => ENHARMONIC[n] || n));
  const rootNorm    = ENHARMONIC[rootNote] || rootNote;

  const whiteKeys = ['C','D','E','F','G','A','B','C','D','E','F','G','A','B'];
  const kw = 34, kh = 110;
  const totalW = whiteKeys.length * kw;
  let whites = '', blacks = '';

  whiteKeys.forEach((note, i) => {
    const isAct  = highlighted.has(note);
    const isRoot = isAct && note === rootNorm;
    const fill   = isRoot ? '#f59e0b' : isAct ? accentColor : '#f1f5f9';
    whites += `<rect x="${i*kw}" y="0" width="${kw-2}" height="${kh}" rx="3" fill="${fill}" stroke="#334155" stroke-width="1"/>`;
    if (isAct) whites += `<text x="${i*kw+kw/2-1}" y="${kh-10}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${note}</text>`;
  });

  const blackOffsets = [0.6,1.6,3.6,4.6,5.6];
  const blackNotes   = ['C#','D#','F#','G#','A#'];
  const bkw = 22, bkh = 68;
  [0,7].forEach(off => {
    blackOffsets.forEach((boff, bi) => {
      const note   = blackNotes[bi];
      const isAct  = highlighted.has(note);
      const isRoot = isAct && note === rootNorm;
      const fill   = isRoot ? '#f59e0b' : isAct ? accentColor : '#1e293b';
      const x      = (off + boff) * kw - bkw/2;
      blacks += `<rect x="${x}" y="0" width="${bkw}" height="${bkh}" rx="2" fill="${fill}" stroke="#0f172a" stroke-width="1"/>`;
      if (isAct) blacks += `<text x="${x+bkw/2}" y="${bkh-6}" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${note.replace('#','♯')}</text>`;
    });
  });

  return `<div style="overflow-x:auto">
    <svg width="${totalW}" height="${kh}" viewBox="0 0 ${totalW} ${kh}" class="piano-svg">
      ${whites}${blacks}
    </svg>
    <div class="piano-legend" style="margin-top:8px">
      <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>ルート音</span>
      <span class="legend-item"><span class="legend-dot" style="background:${accentColor}"></span>スケール音</span>
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', init);
