/**
 * Web Audio API synthesizer for dice sounds and game effects.
 * Requires no external audio files, works reliably across all browsers.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private volume: number = 0.7;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx?.currentTime || 0);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Sound of dice rattling inside a cup or being shaken
   */
  public playShake() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.06 + Math.random() * 0.02;
      this.playWoodClick(now + delay, 400 + Math.random() * 300, 0.04, 0.25);
    }
  }

  /**
   * Sharp clatter of the die landing and bouncing on the table
   */
  public playDiceRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Series of diminishing clatters
    const bounces = [
      { delay: 0.0, freq: 520, vol: 0.4 },
      { delay: 0.08, freq: 680, vol: 0.3 },
      { delay: 0.15, freq: 800, vol: 0.25 },
      { delay: 0.23, freq: 950, vol: 0.18 },
      { delay: 0.32, freq: 1100, vol: 0.12 },
    ];

    bounces.forEach((b) => {
      this.playWoodClick(now + b.delay, b.freq, 0.05, b.vol);
    });
  }

  /**
   * Sound of die bouncing off table edge
   */
  public playBounce() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.playWoodClick(this.ctx.currentTime, 580 + Math.random() * 200, 0.04, 0.3);
  }

  /**
   * Whoosh sound when player flicks or throws die
   */
  public playWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Final heavy solid thud when the die settles
   */
  public playDiceLand(finalValue: number = 3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // Thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);

    // Chime pitched based on value (1=lowest, 6=brightest!)
    setTimeout(() => {
      this.playPointBeep(finalValue);
    }, 90);
  }

  /**
   * High chime for dice score
   */
  public playPointBeep(value: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Scale: C5 to A5
    const freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0];
    const freq = freqs[Math.max(0, Math.min(5, value - 1))];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Triumphant fanfare
   */
  public playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const notes = [
      { freq: 523.25, dur: 0.12, time: 0 },       // C5
      { freq: 659.25, dur: 0.12, time: 0.12 },    // E5
      { freq: 783.99, dur: 0.15, time: 0.24 },    // G5
      { freq: 1046.50, dur: 0.45, time: 0.39 },   // C6
    ];

    const now = this.ctx.currentTime;
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.3, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
    });
  }

  /**
   * Disappointment / loss chime
   */
  public playDefeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const notes = [
      { freq: 440, dur: 0.2, time: 0 },
      { freq: 415.3, dur: 0.2, time: 0.2 },
      { freq: 392, dur: 0.4, time: 0.4 },
    ];

    const now = this.ctx.currentTime;
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.25, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
    });
  }

  /**
   * Dramatic heartbeat for 3rd final roll
   */
  public playTension() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Crisp UI click
   */
  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playWoodClick(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;

    // Filtered noise click + low resonant tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration);

    oscGain.gain.setValueAtTime(vol, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }
}

export const sound = new SoundController();
