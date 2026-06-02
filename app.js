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
    // For inversions on guitar, show note info only (diagrams are root-position voicings)
    if (inversionIndex === 0) {
      instrumentHTML = renderGuitarDiagram(chordName);
    } else {
      instrumentHTML = `<div class="inversion-note-display">
        <div class="inv-notes-row">${currentInv.notes.map((n, ni) =>
          `<div class="inv-note${ni === 0 ? ' bass' : ''}">${n}${ni === 0 ? '<span class="bass-tag">Bass</span>' : ''}</div>`
        ).join('<span class="inv-sep">→</span>')}</div>
        <p class="guitar-inv-hint">ギターでは転回形のフォームはコードにより様々。<br>構成音の積み順を意識して練習しましょう。</p>
      </div>`;
    }
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
function renderGuitarDiagram(chordName) {
  const voicing = getGuitarVoicing(chordName);
  if (!voicing) {
    return `<div class="no-voicing">ダイアグラムなし (${chordName})</div>`;
  }

  const { frets, barre } = voicing;
  const activeFrets = frets.filter(f => f !== null && f > 0);
  const minFret = activeFrets.length ? Math.min(...activeFrets) : 1;
  const displayMin = barre ? barre : Math.max(1, minFret);
  const fretRange = 4;

  const strings = 6;
  const cellW = 36, cellH = 36, padding = 28;
  const svgW = (strings - 1) * cellW + padding * 2;
  const svgH = fretRange * cellH + padding * 2 + 20;

  let svg = `<svg class="guitar-diagram" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`;

  if (displayMin === 1) {
    svg += `<line x1="${padding}" y1="${padding}" x2="${padding + (strings-1)*cellW}" y2="${padding}" stroke="#e2e8f0" stroke-width="4"/>`;
  } else {
    svg += `<text x="${padding - 4}" y="${padding + cellH * 0.6}" text-anchor="end" fill="#94a3b8" font-size="12">${displayMin}fr</text>`;
  }

  for (let f = 0; f <= fretRange; f++) {
    const y = padding + f * cellH;
    svg += `<line x1="${padding}" y1="${y}" x2="${padding + (strings-1)*cellW}" y2="${y}" stroke="#334155" stroke-width="1"/>`;
  }

  for (let s = 0; s < strings; s++) {
    const x = padding + s * cellW;
    svg += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${padding + fretRange*cellH}" stroke="#475569" stroke-width="1.5"/>`;
  }

  if (barre) {
    const y = padding + (barre - displayMin + 0.5) * cellH;
    svg += `<rect x="${padding - 8}" y="${y - 10}" width="${(strings-1)*cellW + 16}" height="20" rx="10" fill="#6366f1" opacity="0.85"/>`;
  }

  frets.forEach((f, i) => {
    const x = padding + (strings - 1 - i) * cellW;
    if (f === null) {
      svg += `<text x="${x}" y="${padding - 10}" text-anchor="middle" fill="#ef4444" font-size="14">✕</text>`;
    } else if (f === 0) {
      svg += `<circle cx="${x}" cy="${padding - 10}" r="6" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`;
    } else {
      const y = padding + (f - displayMin + 0.5) * cellH;
      if (!barre || f !== barre) {
        svg += `<circle cx="${x}" cy="${y}" r="10" fill="#6366f1"/>`;
      }
    }
  });

  svg += '</svg>';
  return `<div class="diagram-wrap">${svg}</div>`;
}

// ---- Piano Keys ----
const ENHARMONIC = { 'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#' };

function renderPianoKeys(chordNotes, bassNote) {
  const noteList = chordNotes.map(n => ENHARMONIC[n] || n);
  const highlighted = new Set(noteList);
  const bassNorm = ENHARMONIC[bassNote] || bassNote;

  const whiteKeys = ['C','D','E','F','G','A','B','C','D','E','F','G','A','B'];
  const kw = 34, kh = 110;
  const totalW = whiteKeys.length * kw;

  let whites = '', blacks = '';

  whiteKeys.forEach((note, i) => {
    const isActive = highlighted.has(note);
    const isBass = isActive && note === bassNorm;
    const fill = isBass ? '#f59e0b' : isActive ? '#818cf8' : '#f1f5f9';
    whites += `<rect x="${i*kw}" y="0" width="${kw-2}" height="${kh}" rx="3"
      fill="${fill}" stroke="#334155" stroke-width="1"/>`;
    if (isActive) {
      whites += `<text x="${i*kw + kw/2 - 1}" y="${kh - 10}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${note}</text>`;
    }
    if (isBass) {
      whites += `<text x="${i*kw + kw/2 - 1}" y="${kh - 22}" text-anchor="middle" fill="white" font-size="8">低</text>`;
    }
  });

  const blackOffsets = [0.6, 1.6, 3.6, 4.6, 5.6];
  const blackNoteNames = ['C#','D#','F#','G#','A#'];
  const bkw = 22, bkh = 68;

  [0, 7].forEach((octaveOffset) => {
    blackOffsets.forEach((offset, bi) => {
      const x = (octaveOffset + offset) * kw - bkw / 2;
      const note = blackNoteNames[bi];
      const isActive = highlighted.has(note);
      const isBass = isActive && note === bassNorm;
      const fill = isBass ? '#f59e0b' : isActive ? '#818cf8' : '#1e293b';
      blacks += `<rect x="${x}" y="0" width="${bkw}" height="${bkh}" rx="2"
        fill="${fill}" stroke="#0f172a" stroke-width="1"/>`;
      if (isActive) {
        blacks += `<text x="${x + bkw/2}" y="${bkh - 6}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${note}</text>`;
      }
    });
  });

  return `
    <div class="piano-wrap">
      <svg width="${totalW}" height="${kh}" viewBox="0 0 ${totalW} ${kh}" class="piano-svg">
        ${whites}${blacks}
      </svg>
      <div class="piano-legend">
        <span class="legend-item"><span class="legend-dot" style="background:#818cf8"></span>構成音</span>
        <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>最低音（ベース音）</span>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
