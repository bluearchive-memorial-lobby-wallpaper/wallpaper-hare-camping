import { voicePath, type VoiceLocale } from "../config";

interface VoicePlayerCallbacks {
  onEnded: (eventId: string) => void;
  onError: (message: string) => void;
}

export class VoicePlayer {
  private readonly callbacks: VoicePlayerCallbacks;
  private current?: { eventId: string; audio: HTMLAudioElement };
  private volume = 0.7;
  private enabled = true;
  private pausedByHost = false;

  constructor(callbacks: VoicePlayerCallbacks) {
    this.callbacks = callbacks;
  }

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.min(Math.max(volume, 0), 1);
    if (this.current) this.current.audio.volume = this.volume;
    if (!enabled) this.stop();
  }

  async play(eventId: string, locale: VoiceLocale) {
    this.stop();
    if (!this.enabled) return;

    const audio = new Audio(voicePath(eventId, locale));
    audio.preload = "auto";
    audio.volume = this.volume;
    const current = { eventId, audio };
    this.current = current;
    audio.addEventListener("ended", () => {
      if (this.current !== current) return;
      this.current = undefined;
      this.callbacks.onEnded(eventId);
    });
    audio.addEventListener("error", () => {
      if (this.current === current) this.current = undefined;
      this.callbacks.onError(`语音加载失败：${audio.src}`);
    });

    if (this.pausedByHost) return;
    try {
      await audio.play();
    } catch (error) {
      if (this.current === current) this.current = undefined;
      const message = error instanceof Error ? error.message : String(error);
      this.callbacks.onError(`语音播放失败：${message}`);
    }
  }

  setPaused(paused: boolean) {
    this.pausedByHost = paused;
    const audio = this.current?.audio;
    if (!audio) return;
    if (paused) {
      audio.pause();
      return;
    }
    void audio.play().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.callbacks.onError(`语音恢复失败：${message}`);
    });
  }

  stop() {
    if (!this.current) return;
    this.current.audio.pause();
    this.current.audio.removeAttribute("src");
    this.current.audio.load();
    this.current = undefined;
  }

  getSnapshot() {
    return {
      eventId: this.current?.eventId ?? null,
      playing: Boolean(this.current && !this.current.audio.paused),
      enabled: this.enabled,
      volume: this.volume,
      pausedByHost: this.pausedByHost,
    };
  }
}
