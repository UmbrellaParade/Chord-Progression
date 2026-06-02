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

// ---- Scales & Modes ----
const SCALE_CATEGORIES = [
  { id: 'mode',  label: 'モード' },
  { id: 'penta', label: 'ペンタトニック' },
  { id: 'blues', label: 'ブルース' },
  { id: 'japan', label: '🇯🇵 日本' },
  { id: 'world', label: '🌏 ワールド' },
  { id: 'other', label: '理論系' },
];

const SCALES = [
  // --- Modes ---
  {
    id: 'ionian', name: 'メジャー', nameEn: 'Ionian',
    intervals: [0,2,4,5,7,9,11], category: 'mode', color: '#4ade80',
    degrees: ['1','2','3','4','5','6','7'],
    desc: '明るく安定した基本スケール。ポップス・クラシックの土台。',
    use: 'Pop / Classical / Rock',
  },
  {
    id: 'dorian', name: 'ドリアン', nameEn: 'Dorian',
    intervals: [0,2,3,5,7,9,10], category: 'mode', color: '#60a5fa',
    degrees: ['1','2','♭3','4','5','6','♭7'],
    desc: 'マイナーだが6度が長音程で少し明るさがある。ジャズ・フュージョンの定番。',
    use: 'Jazz / Fusion / Rock',
  },
  {
    id: 'phrygian', name: 'フリジアン', nameEn: 'Phrygian',
    intervals: [0,1,3,5,7,8,10], category: 'mode', color: '#a78bfa',
    degrees: ['1','♭2','♭3','4','5','♭6','♭7'],
    desc: '♭2度が生み出す独特の緊張感と異国情緒。フラメンコ・メタルに多用。',
    use: 'Flamenco / Metal / Film',
  },
  {
    id: 'lydian', name: 'リディアン', nameEn: 'Lydian',
    intervals: [0,2,4,6,7,9,11], category: 'mode', color: '#fbbf24',
    degrees: ['1','2','3','♯4','5','6','7'],
    desc: '♯4度が浮遊感と神秘的な明るさを演出。映画音楽・ドリームポップに。',
    use: 'Film Score / Dream Pop / Fusion',
  },
  {
    id: 'mixolydian', name: 'ミクソリディアン', nameEn: 'Mixolydian',
    intervals: [0,2,4,5,7,9,10], category: 'mode', color: '#fb923c',
    degrees: ['1','2','3','4','5','6','♭7'],
    desc: 'メジャーに♭7を加えたブルージーな渋さ。ロック・カントリーに最頻出。',
    use: 'Rock / Blues / Country / Funk',
  },
  {
    id: 'aeolian', name: 'ナチュラルマイナー', nameEn: 'Aeolian',
    intervals: [0,2,3,5,7,8,10], category: 'mode', color: '#94a3b8',
    degrees: ['1','2','♭3','4','5','♭6','♭7'],
    desc: '暗く哀愁ある基本マイナースケール。ポップスのマイナー進行の基礎。',
    use: 'Pop / Rock / Metal',
  },
  {
    id: 'locrian', name: 'ロクリアン', nameEn: 'Locrian',
    intervals: [0,1,3,5,6,8,10], category: 'mode', color: '#f87171',
    degrees: ['1','♭2','♭3','4','♭5','♭6','♭7'],
    desc: '最も不安定なモード。♭5がVIIm7♭5コードに対応。ジャズ理論で重要。',
    use: 'Jazz / Progressive / Metal',
  },
  // --- Pentatonic ---
  {
    id: 'major_penta', name: 'メジャーペンタトニック', nameEn: 'Major Pentatonic',
    intervals: [0,2,4,7,9], category: 'penta', color: '#34d399',
    degrees: ['1','2','3','5','6'],
    desc: '5音で構成されるシンプルで明るいスケール。どのキーでも使いやすい万能スケール。',
    use: 'Pop / Country / Rock / J-Pop',
  },
  {
    id: 'minor_penta', name: 'マイナーペンタトニック', nameEn: 'Minor Pentatonic',
    intervals: [0,3,5,7,10], category: 'penta', color: '#38bdf8',
    degrees: ['1','♭3','4','5','♭7'],
    desc: 'ロック・ブルースのギターソロの定番。5音なのでどこで弾いても外れにくい。',
    use: 'Rock / Blues / Metal',
  },
  // --- Blues ---
  {
    id: 'blues', name: 'ブルーススケール', nameEn: 'Blues Scale',
    intervals: [0,3,5,6,7,10], category: 'blues', color: '#c084fc',
    degrees: ['1','♭3','4','♭5','5','♭7'],
    desc: 'マイナーペンタに♭5（ブルーノート）を追加。このノートが独特の「泣き」と「うなり」を生む。',
    use: 'Blues / Rock / Jazz',
  },

  // --- 日本のスケール ---
  {
    id: 'miyakobushi', name: '都節音階', nameEn: 'Miyako-bushi',
    intervals: [0,1,5,7,8], category: 'japan', color: '#fb7185',
    degrees: ['1','♭2','4','5','♭6'],
    desc: '江戸時代の三味線・琴から生まれた最も「和風」なスケール。♭2と♭6が哀愁と緊張を生む。',
    use: '邦楽 / 演歌 / J-Pop和風アレンジ',
  },
  {
    id: 'ryukyu', name: '沖縄音階', nameEn: 'Ryukyu Scale',
    intervals: [0,4,5,7,11], category: 'japan', color: '#22d3ee',
    degrees: ['1','3','4','5','7'],
    desc: '沖縄・琉球音楽の明るいスケール。長3度と長7度が独特の南国感と開放感を演出。',
    use: '沖縄民謡 / ポップス和風',
  },
  {
    id: 'yosen', name: '陽旋法', nameEn: 'Yo Scale',
    intervals: [0,2,5,7,9], category: 'japan', color: '#a3e635',
    degrees: ['1','2','4','5','6'],
    desc: '日本の民謡・わらべ歌に使われる明るいペンタトニック。全音と4度の動きが日本的な柔らかさを生む。',
    use: '日本民謡 / 童謡',
  },

  // --- ワールドスケール ---
  {
    id: 'hijaz', name: 'ヒジャーズ', nameEn: 'Hijaz (Phrygian Dominant)',
    intervals: [0,1,4,5,7,8,10], category: 'world', color: '#fcd34d',
    degrees: ['1','♭2','3','4','5','♭6','♭7'],
    desc: '中東・フラメンコの象徴的サウンド。♭2と長3度の増2度音程が強烈な「エキゾチック感」を生む。',
    use: 'Middle Eastern / Flamenco / Indian / Turkish',
  },
  {
    id: 'doubleharmonic', name: 'ダブルハーモニック', nameEn: 'Double Harmonic (Byzantine)',
    intervals: [0,1,4,5,7,8,11], category: 'world', color: '#f97316',
    degrees: ['1','♭2','3','4','5','♭6','7'],
    desc: '「インド＋中東」の凝縮サウンド。♭2、長3度、♭6、長7度が共存する最も「異国感」の強いスケール。',
    use: 'Indian Classical / Middle Eastern / Byzantine',
  },
  {
    id: 'harmonicminor', name: 'ハーモニックマイナー', nameEn: 'Harmonic Minor',
    intervals: [0,2,3,5,7,8,11], category: 'world', color: '#818cf8',
    degrees: ['1','2','♭3','4','5','♭6','7'],
    desc: 'ナチュラルマイナーの7度を半音上げたスケール。♭6と7の増2度音程がドラマチックな緊張感を生む。',
    use: 'Classical / Metal / Middle Eastern / Gypsy',
  },
  {
    id: 'hungarianminor', name: 'ハンガリーマイナー', nameEn: 'Hungarian Minor',
    intervals: [0,2,3,6,7,8,11], category: 'world', color: '#e879f9',
    degrees: ['1','2','♭3','♯4','5','♭6','7'],
    desc: 'ハーモニックマイナーの4度を♯4にしたスケール。♭3と♯4の増2度が東欧ジプシー音楽の情熱的な響きを生む。',
    use: 'Gypsy / Eastern European / Metal / Flamenco',
  },
  {
    id: 'persian', name: 'ペルシアン', nameEn: 'Persian',
    intervals: [0,1,4,5,6,8,11], category: 'world', color: '#4ade80',
    degrees: ['1','♭2','3','4','♭5','♭6','7'],
    desc: 'ペルシャ・イラン音楽由来。♭2、♭5、長7度が混在し、他のどのスケールとも違う独自の緊張と神秘感を持つ。',
    use: 'Persian / Middle Eastern / Film Score',
  },
  {
    id: 'enigmatic', name: 'エニグマティック', nameEn: 'Enigmatic Scale',
    intervals: [0,1,4,6,8,10,11], category: 'world', color: '#06b6d4',
    degrees: ['1','♭2','3','♯4','♯5','♯6','7'],
    desc: 'ヴェルディが考案した謎めいたスケール。全音音程が続く独自の浮遊感と未知の宇宙感を演出する。',
    use: 'Contemporary Classical / Film Score / Experimental',
  },

  // --- 理論系スケール ---
  {
    id: 'wholetone', name: 'ホールトーン', nameEn: 'Whole Tone',
    intervals: [0,2,4,6,8,10], category: 'other', color: '#67e8f9',
    degrees: ['1','2','3','♯4','♯5','♭7'],
    desc: '全て全音で構成された6音スケール。長調でも短調でもない曖昧な浮遊感が特徴。ドビュッシーが多用。',
    use: 'Impressionism / Jazz / Film',
  },
  {
    id: 'diminished_hw', name: 'ディミニッシュ（半-全）', nameEn: 'Diminished (H-W)',
    intervals: [0,1,3,4,6,7,9,10], category: 'other', color: '#f43f5e',
    degrees: ['1','♭2','♭3','3','♭5','5','6','♭7'],
    desc: '半音・全音を交互に繰り返す8音スケール。対称性から転調がしやすく、ジャズのアウトフレーズに多用。',
    use: 'Jazz / Metal / Contemporary',
  },
  {
    id: 'altered', name: 'オルタード', nameEn: 'Altered Scale',
    intervals: [0,1,3,4,6,8,10], category: 'other', color: '#ff6b6b',
    degrees: ['1','♭2','♭3','3','♭5','♭6','♭7'],
    desc: 'ジャズのV7コード上で使う超テンションスケール。全ての音が変化音（♭9、♯9、♭5、♯5）を含む。',
    use: 'Jazz / Bebop / Fusion',
  },
];

function getScaleNotes(key, intervals) {
  const rootIndex = CHROMATIC.indexOf(keyToChromatic(key));
  return intervals.map(interval => {
    const idx = (rootIndex + interval) % 12;
    let note = CHROMATIC[idx];
    if (FLAT_KEYS.has(key) && FLAT_NAMES[note]) note = FLAT_NAMES[note];
    return note;
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
