class PiezoAudioSynth {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private stopTimer: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  playTone(freqHz: number, durationMs: number): void {
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx || freqHz <= 0 || durationMs <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freqHz, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    this.osc = osc;
    this.gain = gain;
    this.stopTimer = window.setTimeout(() => this.stop(), durationMs + 20);
  }

  stop(): void {
    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {
        // already stopped
      }
      this.osc = null;
    }
    if (this.gain) {
      try {
        this.gain.disconnect();
      } catch {
        // already disconnected
      }
      this.gain = null;
    }
  }
}

export const simPiezo = new PiezoAudioSynth();
