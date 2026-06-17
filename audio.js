// ---- Audio Engine (Tone.js + Salamander Piano Samples) ----

let sampler = null;
let samplerReady = false;
let scalePlayId = 0;

// Semitone index for note names
const NOTE_SEMI = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,
  'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11
};

async function initAudio() {
  await Tone.start();
  if (sampler) return;

  setPlayButtonsState(false, '読込中…');

  sampler = new Tone.Sampler({
    urls: {
      C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
      C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
      C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
    },
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
    release: 1.5,
    onload: () => {
      samplerReady = true;
      setPlayButtonsState(true, null);
    },
    onerror: () => {
      // フォールバック: シンセサイザー
      sampler = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1.5 },
        volume: -6,
      }).toDestination();
      samplerReady = true;
      setPlayButtonsState(true, null);
    },
  }).toDestination();
}

function setPlayButtonsState(enabled, label) {
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.disabled = !enabled;
    if (label) btn.textContent = label;
  });
}

// ノート名にオクターブを付与（根音から積み上げ）
function notesWithOctaves(notes, startOctave) {
  let octave = startOctave;
  let prevSemi = -1;
  return notes.map(note => {
    const semi = NOTE_SEMI[note] ?? 0;
    if (prevSemi >= 0 && semi <= prevSemi) octave++;
    prevSemi = semi;
    return `${note}${octave}`;
  });
}

// コード（和音）を鳴らす
async function playChord(notes) {
  await initAudio();
  if (!samplerReady) return;
  scalePlayId++; // スケール再生を止める
  const toneNotes = notesWithOctaves(notes, 3);
  sampler.triggerAttackRelease(toneNotes, '1n');
}

// スケールを順番に鳴らす
async function playScale(notes, onStep) {
  await initAudio();
  if (!samplerReady) return;

  const myId = ++scalePlayId;

  // 上行して根音に戻る（1オクターブ上）
  const ascending = notesWithOctaves(notes, 4);
  const lastOct = parseInt(ascending[ascending.length - 1].replace(/[^0-9]/g, ''));
  ascending.push(`${notes[0]}${lastOct + 1}`);

  for (let i = 0; i < ascending.length; i++) {
    if (scalePlayId !== myId) {
      if (onStep) onStep(-1); // 停止シグナル
      return;
    }
    sampler.triggerAttackRelease(ascending[i], '4n');
    if (onStep) onStep(i < notes.length ? i : 0);
    await new Promise(r => setTimeout(r, 380));
  }

  if (onStep) onStep(-1);
}

function stopAudio() {
  scalePlayId++;
}
