let audioCtx = null;
let master = null;
let droneOscs = [];
let droneGain = null;
let started = false;

function ensureAudio() {
  if (started) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.35;
    master.connect(audioCtx.destination);

    droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.12;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    droneGain.connect(lp);
    lp.connect(master);

    const freqs = [110, 164.81, 220];
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = audioCtx.createGain();
      g.gain.value = 0.4;
      o.connect(g);
      g.connect(droneGain);
      o.start();
      droneOscs.push(o);
    });

    // slow LFO
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    droneOscs[0].frequency.connect ? null : null;
    lfoGain.connect(droneOscs[0].frequency);
    lfo.start();

    started = true;
  } catch (e) { started = false; }
}

function blip(freq, dur, type, vol) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function sfxCollect() { blip(880, 0.12, 'sine', 0.18); setTimeout(()=>blip(1320,0.1,'sine',0.12),60); }
function sfxGate() { [523,659,784].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'triangle',0.15),i*80)); }
function sfxHit() { blip(180, 0.2, 'sawtooth', 0.2); setTimeout(()=>blip(90,0.25,'square',0.15),80); }
function sfxVictory() { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,0.25,'triangle',0.18),i*120)); }
function sfxStep() {}
window.audio = { ensureAudio, sfxCollect, sfxGate, sfxHit, sfxVictory };
