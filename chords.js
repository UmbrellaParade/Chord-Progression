const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FLAT_NAMES = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db']);

// Bb/Eb/Ab/Db/Gb は CHROMATIC に存在しないので A#/D#/G#/C#/F# に変換してから indexOf する
const FLAT_TO_SHARP = { 'Bb': 'A#', 'Eb': 'D#', 'Ab': 'G#', 'Db': 'C#', 'Gb': 'F#' };
function keyToChromatic(key) { return FLAT_TO_SHARP[key] || key; }

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
  const rootIndex = CHROMATIC.indexOf(keyToChromatic(key));
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
  const rootIndex = CHROMATIC.indexOf(keyToChromatic(key));
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

// ---- Guitar chord diagrams with all inversions ----
// frets: [lowE, A, D, G, B, highE]  null=mute, 0=open, n=fret
// Each entry is an array: [root, 1st inv, 2nd inv, (3rd inv for 7ths)]
// label: bass note for each inversion (shown on diagram)

const GUITAR_INV_VOICINGS = {
  // --- C major (C-E-G) ---
  'C': [
    { frets: [null,3,2,0,1,0], barre: null, pos: 'Open' },   // 根音形  C bass
    { frets: [0,3,2,0,1,0],   barre: null, pos: 'Open' },    // 1st inv  E bass
    { frets: [3,3,2,0,1,0],   barre: null, pos: '3fr' },     // 2nd inv  G bass
  ],
  // --- Dm (D-F-A) ---
  'Dm': [
    { frets: [null,null,0,2,3,1], barre: null, pos: 'Open' }, // 根音形  D bass
    { frets: [1,null,0,2,3,1],   barre: null, pos: '1fr' },   // 1st inv  F bass
    { frets: [null,0,0,2,3,1],   barre: null, pos: 'Open' },  // 2nd inv  A bass
  ],
  // --- Em (E-G-B) ---
  'Em': [
    { frets: [0,2,2,0,0,0],    barre: null, pos: 'Open' },   // 根音形  E bass
    { frets: [3,2,2,0,0,0],    barre: null, pos: '3fr' },    // 1st inv  G bass
    { frets: [null,2,2,0,0,0], barre: null, pos: 'Open' },   // 2nd inv  B bass
  ],
  // --- F major (F-A-C) ---
  'F': [
    { frets: [1,1,2,3,3,1],    barre: 1,    pos: '1fr' },    // 根音形  F bass
    { frets: [null,0,3,2,1,1], barre: null, pos: 'Open' },   // 1st inv  A bass
    { frets: [null,3,3,2,1,1], barre: null, pos: '3fr' },    // 2nd inv  C bass
  ],
  // --- G major (G-B-D) ---
  'G': [
    { frets: [3,2,0,0,0,3],    barre: null, pos: 'Open' },   // 根音形  G bass
    { frets: [null,2,0,0,0,3], barre: null, pos: 'Open' },   // 1st inv  B bass
    { frets: [null,null,0,0,0,3], barre: null, pos: 'Open' },// 2nd inv  D bass
  ],
  // --- G7 (G-B-D-F) ---
  'G7': [
    { frets: [3,2,0,0,0,1],    barre: null, pos: 'Open' },   // 根音形  G bass
    { frets: [null,2,0,0,0,1], barre: null, pos: 'Open' },   // 1st inv  B bass
    { frets: [null,null,0,0,0,1], barre: null, pos: 'Open' },// 2nd inv  D bass
    { frets: [1,2,0,0,0,1],    barre: null, pos: '1fr' },    // 3rd inv  F bass
  ],
  // --- Am (A-C-E) ---
  'Am': [
    { frets: [null,0,2,2,1,0], barre: null, pos: 'Open' },   // 根音形  A bass
    { frets: [null,3,2,2,1,0], barre: null, pos: '3fr' },    // 1st inv  C bass
    { frets: [0,0,2,2,1,0],   barre: null, pos: 'Open' },    // 2nd inv  E bass
  ],
  // --- Bdim (B-D-F) ---
  'Bdim': [
    { frets: [null,2,3,4,3,null], barre: null, pos: '2fr' }, // 根音形  B bass
    { frets: [null,null,0,4,0,1], barre: null, pos: 'Open' },// 1st inv  D bass
    { frets: [1,null,null,4,3,null], barre: null, pos: '1fr' },// 2nd inv  F bass
  ],
  // --- D major (D-F#-A) ---
  'D': [
    { frets: [null,null,0,2,3,2], barre: null, pos: 'Open' },// 根音形  D bass
    { frets: [null,null,4,2,3,2], barre: null, pos: '2fr' }, // 1st inv  F# bass
    { frets: [null,0,0,2,3,2],   barre: null, pos: 'Open' }, // 2nd inv  A bass
  ],
  // --- A major (A-C#-E) ---
  'A': [
    { frets: [null,0,2,2,2,0], barre: null, pos: 'Open' },   // 根音形  A bass
    { frets: [null,4,2,2,2,0], barre: null, pos: '2fr' },    // 1st inv  C# bass
    { frets: [0,0,2,2,2,0],   barre: null, pos: 'Open' },    // 2nd inv  E bass
  ],
  // --- E major (E-G#-B) ---
  'E': [
    { frets: [0,2,2,1,0,0],    barre: null, pos: 'Open' },   // 根音形  E bass
    { frets: [4,2,2,1,0,0],    barre: null, pos: '2fr' },    // 1st inv  G# bass
    { frets: [null,2,2,1,0,0], barre: null, pos: 'Open' },   // 2nd inv  B bass
  ],
  // --- B major (B-D#-F#) ---
  'B': [
    { frets: [null,2,4,4,4,2], barre: 2, pos: '2fr' },       // 根音形  B bass
    { frets: [null,null,4,4,4,2], barre: null, pos: '2fr' }, // 1st inv  D# bass (D string fret4=F#? no...)
    { frets: [null,2,4,4,4,null], barre: 2, pos: '2fr' },    // 2nd inv  F# bass
  ],
  // --- Bm (B-D-F#) ---
  'Bm': [
    { frets: [null,2,4,4,3,2], barre: 2, pos: '2fr' },       // 根音形  B bass
    { frets: [null,null,0,4,3,2], barre: null, pos: 'Open' },// 1st inv  D bass (D open)
    { frets: [2,2,4,4,3,null], barre: 2, pos: '2fr' },       // 2nd inv  F# bass
  ],
  // --- F# major (F#-A#-C#) ---
  'F#': [
    { frets: [2,4,4,3,2,2], barre: 2, pos: '2fr' },          // 根音形  F# bass
    { frets: [null,null,4,3,2,2], barre: null, pos: '2fr' }, // 1st inv  A# bass
    { frets: [null,4,4,3,2,null], barre: null, pos: '2fr' }, // 2nd inv  C# bass
  ],
  // --- F#m (F#-A-C#) ---
  'F#m': [
    { frets: [2,2,4,4,3,2], barre: 2, pos: '2fr' },          // 根音形
    { frets: [null,null,4,4,3,2], barre: null, pos: '2fr' }, // 1st inv  A bass
    { frets: [null,2,4,4,3,null], barre: 2, pos: '2fr' },    // 2nd inv  C# bass
  ],
  // --- Bb major (Bb-D-F) ---
  'Bb': [
    { frets: [null,1,3,3,3,1], barre: 1, pos: '1fr' },       // 根音形  Bb bass
    { frets: [null,null,3,3,3,1], barre: null, pos: '1fr' }, // 1st inv  D bass
    { frets: [null,1,3,3,null,null], barre: null, pos: '1fr' },// 2nd inv  F bass
  ],
  // --- Gm (G-Bb-D) ---
  'Gm': [
    { frets: [3,5,5,3,3,3], barre: 3, pos: '3fr' },          // 根音形  G bass
    { frets: [null,null,5,3,3,3], barre: 3, pos: '3fr' },    // 1st inv  Bb bass
    { frets: [null,5,5,3,3,null], barre: 3, pos: '3fr' },    // 2nd inv  D bass
  ],
  // --- Eb major (Eb-G-Bb) ---
  'Eb': [
    { frets: [null,null,1,3,4,3], barre: null, pos: '1fr' }, // 根音形  Eb bass
    { frets: [null,null,null,3,4,3], barre: null, pos: '3fr' },// 1st inv  G bass
    { frets: [null,1,1,3,4,null], barre: 1, pos: '1fr' },    // 2nd inv  Bb bass
  ],
  // --- Ab major (Ab-C-Eb) ---
  'Ab': [
    { frets: [4,4,6,6,6,4], barre: 4, pos: '4fr' },          // 根音形  Ab bass
    { frets: [null,null,6,6,6,4], barre: null, pos: '4fr' }, // 1st inv  C bass
    { frets: [null,4,6,6,null,null], barre: null, pos: '4fr' },// 2nd inv  Eb bass
  ],
  // --- Db major (Db-F-Ab) ---
  'Db': [
    { frets: [null,4,6,6,6,4], barre: 4, pos: '4fr' },       // 根音形  Db bass
    { frets: [null,null,6,6,6,4], barre: null, pos: '4fr' }, // 1st inv  F bass
    { frets: [null,4,6,6,null,null], barre: 4, pos: '4fr' }, // 2nd inv  Ab bass
  ],
  // --- C#m (C#-E-G#) ---
  'C#m': [
    { frets: [null,4,6,6,5,4], barre: 4, pos: '4fr' },       // 根音形
    { frets: [null,null,6,6,5,4], barre: null, pos: '4fr' }, // 1st inv  E bass
    { frets: [null,4,6,6,null,null], barre: 4, pos: '4fr' }, // 2nd inv  G# bass
  ],
  // --- G#m (G#-B-D#) ---
  'G#m': [
    { frets: [4,6,6,4,4,4], barre: 4, pos: '4fr' },          // 根音形
    { frets: [null,null,6,4,4,4], barre: 4, pos: '4fr' },    // 1st inv  B bass
    { frets: [null,6,6,4,4,null], barre: 4, pos: '4fr' },    // 2nd inv  D# bass
  ],
  // --- 7th chords ---
  'D7': [
    { frets: [null,null,0,2,1,2], barre: null, pos: 'Open' },// 根音形
    { frets: [null,null,4,2,1,2], barre: null, pos: '2fr' }, // 1st inv  F# bass
    { frets: [null,0,0,2,1,2],   barre: null, pos: 'Open' }, // 2nd inv  A bass
    { frets: [null,null,0,2,1,0], barre: null, pos: 'Open' },// 3rd inv  C bass
  ],
  'A7': [
    { frets: [null,0,2,0,2,0], barre: null, pos: 'Open' },   // 根音形
    { frets: [null,4,2,0,2,0], barre: null, pos: 'Open' },   // 1st inv  C# bass
    { frets: [0,0,2,0,2,0],   barre: null, pos: 'Open' },    // 2nd inv  E bass
    { frets: [null,0,2,0,2,null], barre: null, pos: 'Open' },// 3rd inv  G bass
  ],
  'E7': [
    { frets: [0,2,0,1,0,0], barre: null, pos: 'Open' },      // 根音形
    { frets: [4,2,0,1,0,0], barre: null, pos: 'Open' },      // 1st inv  G# bass
    { frets: [null,2,0,1,0,0], barre: null, pos: 'Open' },   // 2nd inv  B bass
    { frets: [null,null,0,1,0,0], barre: null, pos: 'Open' },// 3rd inv  D bass
  ],
  'B7': [
    { frets: [null,2,1,2,0,2], barre: null, pos: '1fr' },    // 根音形
    { frets: [null,null,1,2,0,2], barre: null, pos: '1fr' }, // 1st inv  D# bass
    { frets: [null,2,1,2,0,null], barre: null, pos: '1fr' }, // 2nd inv  F# bass
    { frets: [null,null,null,2,0,2], barre: null, pos: '2fr' },// 3rd inv A bass
  ],
  'C7': [
    { frets: [null,3,2,3,1,0], barre: null, pos: '1fr' },    // 根音形
    { frets: [0,3,2,3,1,0],   barre: null, pos: 'Open' },    // 1st inv  E bass
    { frets: [3,3,2,3,1,0],   barre: null, pos: '3fr' },     // 2nd inv  G bass
    { frets: [null,null,2,3,1,2], barre: null, pos: '1fr' }, // 3rd inv  Bb bass
  ],
  'F7': [
    { frets: [1,1,2,1,3,1], barre: 1, pos: '1fr' },          // 根音形
    { frets: [null,0,2,1,3,1], barre: null, pos: '1fr' },    // 1st inv  A bass
    { frets: [null,3,2,1,3,1], barre: null, pos: '1fr' },    // 2nd inv  C bass
    { frets: [null,null,2,1,3,null], barre: null, pos: '1fr' },// 3rd inv Eb bass
  ],
};

// Returns voicing for chordName at inversionIndex (0=root, 1=1st, ...)
function getGuitarVoicing(chordName, inversionIndex) {
  const invList = GUITAR_INV_VOICINGS[chordName];
  if (!invList) return null;
  const idx = Math.min(inversionIndex, invList.length - 1);
  return invList[idx] || invList[0];
}
