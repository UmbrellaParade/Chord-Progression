const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FLAT_NAMES = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db']);

// Major scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

// Diatonic chord qualities for major key
const DIATONIC_QUALITY = ['maj', 'min', 'min', 'maj', 'dom', 'min', 'dim'];

const DEGREE_NAMES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const FUNCTION_LABELS = {
  I:   { label: 'Tonic',       color: '#4ade80' },
  II:  { label: 'Subdominant', color: '#60a5fa' },
  III: { label: 'Tonic',       color: '#4ade80' },
  IV:  { label: 'Subdominant', color: '#60a5fa' },
  V:   { label: 'Dominant',    color: '#f87171' },
  VI:  { label: 'Tonic',       color: '#4ade80' },
  VII: { label: 'Dominant',    color: '#f87171' },
};

// degree: 0-based index (0=I, 1=II, ...)
function getChordName(key, degreeIndex, useLower) {
  const rootIndex = CHROMATIC.indexOf(key);
  const noteIndex = (rootIndex + MAJOR_SCALE[degreeIndex]) % 12;
  let note = CHROMATIC[noteIndex];
  if (FLAT_KEYS.has(key) && FLAT_NAMES[note]) note = FLAT_NAMES[note];
  const q = DIATONIC_QUALITY[degreeIndex];
  if (q === 'maj') return note;
  if (q === 'min') return note + 'm';
  if (q === 'dom') return note + '7';
  if (q === 'dim') return note + 'dim';
  return note;
}

// Returns note names for a chord (maj=1,3,5 / min=1,b3,5 / dom=1,3,5,b7 / dim=1,b3,b5)
const CHORD_INTERVALS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dom: [0, 4, 7, 10],
  dim: [0, 3, 6],
};

function getChordNotes(key, degreeIndex) {
  const rootIndex = CHROMATIC.indexOf(key);
  const scaleRoot = (rootIndex + MAJOR_SCALE[degreeIndex]) % 12;
  const q = DIATONIC_QUALITY[degreeIndex];
  return CHORD_INTERVALS[q].map(interval => {
    const idx = (scaleRoot + interval) % 12;
    let note = CHROMATIC[idx];
    if (FLAT_KEYS.has(key) && FLAT_NAMES[note]) note = FLAT_NAMES[note];
    return note;
  });
}

// Returns all inversions as arrays of note names (root pos + all inversions)
const INVERSION_NAMES = [
  ['根音形', 'Root Position'],
  ['第1転回形', '1st Inversion'],
  ['第2転回形', '2nd Inversion'],
  ['第3転回形', '3rd Inversion'],
];

function getChordInversions(key, degreeIndex) {
  const notes = getChordNotes(key, degreeIndex);
  return notes.map((_, i) => {
    const inv = [...notes.slice(i), ...notes.slice(0, i)];
    return {
      name: INVERSION_NAMES[i][0],
      nameEn: INVERSION_NAMES[i][1],
      notes: inv,
      bassNote: inv[0],
    };
  });
}

// ---- Presets ----
const PRESETS = [
  {
    id: 'diatonic',
    name: 'ダイアトニック',
    desc: 'スケール上の全7コード。すべての進行の土台',
    degrees: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'loop',
    name: '循環コード',
    desc: 'I-VI-II-V。ポップス・ジャズの最頻出ループ',
    degrees: [0, 5, 1, 4],
  },
  {
    id: 'royal',
    name: '王道進行',
    desc: 'IV-V-III-VI。J-popの定番、感情的な盛り上がり',
    degrees: [3, 4, 2, 5],
  },
  {
    id: 'canon',
    name: 'カノン進行',
    desc: 'I-V-VI-III-IV-I-IV-V。ポップス全般に使われる黄金進行',
    degrees: [0, 4, 5, 2, 3, 0, 3, 4],
  },
  {
    id: 'twofivelone',
    name: 'ii-V-I',
    desc: 'ジャズの基本。ドミナントモーションを体に染み込ませる',
    degrees: [1, 4, 0],
  },
];

// ---- Guitar chord diagrams (simplified, most common voicings) ----
// Format: { fret, fingers: [[string1-6, fret]] } string 1=高音E, 6=低音E
// We store for each root note and quality
// Simplified: only natural keys and a few common voicings
// frets: array of 6, null=mute, 0=open, n=fret number
// barre: optional barre fret

const GUITAR_VOICINGS = {
  // Open chords
  'C':    { frets: [null,3,2,0,1,0], barre: null },
  'Dm':   { frets: [null,null,0,2,3,1], barre: null },
  'Em':   { frets: [0,2,2,0,0,0], barre: null },
  'F':    { frets: [1,1,2,3,3,1], barre: 1 },
  'G':    { frets: [3,2,0,0,0,3], barre: null },
  'Am':   { frets: [null,0,2,2,1,0], barre: null },
  'Bdim': { frets: [null,2,0,1,3,null], barre: null },
  // Sharp/flat roots as barre chords
  'D':    { frets: [null,null,0,2,3,2], barre: null },
  'Bm':   { frets: [null,2,4,4,3,2], barre: 2 },
  'F#m':  { frets: [2,2,4,4,3,2], barre: 2 },
  'A':    { frets: [null,0,2,2,2,0], barre: null },
  'E':    { frets: [0,2,2,1,0,0], barre: null },
  'C#m':  { frets: [null,4,6,6,5,4], barre: 4 },
  'G#m':  { frets: [null,null,6,8,8,6], barre: 6 },
  'B':    { frets: [null,2,4,4,4,2], barre: 2 },
  'F#':   { frets: [2,4,4,3,2,2], barre: 2 },
  'Bb':   { frets: [null,1,3,3,3,1], barre: 1 },
  'Gm':   { frets: [null,null,5,3,3,3], barre: 3 },
  'Eb':   { frets: [null,null,1,3,4,3], barre: null },
  'Ab':   { frets: [null,null,6,5,4,4], barre: 4 },
  'Db':   { frets: [null,4,3,1,2,null], barre: null },
  'G7':   { frets: [1,0,0,0,2,3], barre: null },
  'D7':   { frets: [null,null,0,2,1,2], barre: null },
  'A7':   { frets: [null,0,2,0,2,0], barre: null },
  'E7':   { frets: [0,2,0,1,0,0], barre: null },
  'B7':   { frets: [null,2,1,2,0,2], barre: null },
  'C7':   { frets: [null,3,2,3,1,0], barre: null },
  'F7':   { frets: [1,1,2,1,3,1], barre: 1 },
};

function getGuitarVoicing(chordName) {
  if (GUITAR_VOICINGS[chordName]) return GUITAR_VOICINGS[chordName];
  // fallback: try without suffix for simplified display
  return null;
}
