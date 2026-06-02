let state = {
  preset: PRESETS[0],
  key: 'C',
  mode: 'guitar',
  selectedDegree: null,
  selectedInversion: 0,
};

function init() {
  renderPresets();
  renderKeys();
  renderProgression();
  document.getElementById('randomKey').addEventListener('click', () => {
    const idx = Math.floor(Math.random() * KEYS.length);
    setKey(KEYS[idx]);
  });
  document.getElementById('modeGuitar').addEventListener('click', () => setMode('guitar'));
  document.getElementById('modePiano').addEventListener('click', () => setMode('piano'));
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
  renderProgression();
  clearDetail();
}

function setMode(m) {
  state.mode = m;
  document.querySelectorAll('.toggle').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  if (state.selectedDegree !== null) showDetail(state.selectedDegree, state.selectedInversion);
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

document.addEventListener('DOMContentLoaded', init);
