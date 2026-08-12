import { BGM } from "../config";

export type BgmStatus =
  | "disabled"
  | "loading"
  | "playing"
  | "paused"
  | "blocked"
  | "error";

interface BgmPlayerCallbacks {
  onStatusChange: (status: BgmStatus) => void;
  onError: (message: string) => void;
}

export class BgmPlayer {
  private readonly audio = new Audio();
  private readonly callbacks: BgmPlayerCallbacks;
  private sourceAssigned = false;
  private enabled = true;
  private pausedByHost = false;
  private status: BgmStatus = "loading";
  private playbackAttempt = 0;
  private playbackPending = false;

  constructor(callbacks: BgmPlayerCallbacks) {
    this.callbacks = callbacks;
    this.audio.autoplay = true;
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0.25;
    this.audio.addEventListener("playing", () => this.setStatus("playing"));
    this.audio.addEventListener("error", () => {
      this.setStatus("error");
      callbacks.onError(`BGM 加载失败：${this.audio.src}`);
    });
  }

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.audio.volume = Math.min(Math.max(volume, 0), 1);
    if (!enabled) {
      this.cancelPlaybackAttempt();
      this.audio.pause();
      this.setStatus("disabled");
      return;
    }
    if (this.pausedByHost) {
      this.cancelPlaybackAttempt();
      this.audio.pause();
      this.setStatus("paused");
      return;
    }
    void this.requestPlayback();
  }

  async retryFromUserGesture() {
    if (!this.enabled || this.pausedByHost) return false;
    this.ensureSource();
    if (this.status === "playing" && !this.audio.paused) return true;
    this.cancelPlaybackAttempt();
    this.audio.pause();
    return this.requestPlayback();
  }

  async restartFromUserGesture() {
    if (!this.enabled || this.pausedByHost) return false;
    this.ensureSource();
    this.rewind();
    return this.requestPlayback();
  }

  rewind() {
    this.cancelPlaybackAttempt();
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setPaused(paused: boolean) {
    this.pausedByHost = paused;
    if (paused) {
      this.cancelPlaybackAttempt();
      this.audio.pause();
      if (this.enabled) this.setStatus("paused");
      return;
    }
    if (this.enabled) void this.requestPlayback();
  }

  dispose() {
    this.cancelPlaybackAttempt();
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.sourceAssigned = false;
  }

  getSnapshot() {
    return {
      title: BGM.title,
      status: this.status,
      enabled: this.enabled,
      volume: this.audio.volume,
      currentTime: Number(this.audio.currentTime.toFixed(3)),
      duration: Number.isFinite(this.audio.duration)
        ? Number(this.audio.duration.toFixed(3))
        : null,
      pausedByHost: this.pausedByHost,
    };
  }

  private async requestPlayback() {
    if (!this.enabled || this.pausedByHost) return false;
    this.ensureSource();
    if (this.status === "playing" && !this.audio.paused) return true;
    if (this.playbackPending) return false;
    const attempt = ++this.playbackAttempt;
    this.playbackPending = true;
    this.setStatus("loading");
    try {
      await this.audio.play();
      if (attempt !== this.playbackAttempt) return false;
      this.playbackPending = false;
      this.setStatus("playing");
      return true;
    } catch (error) {
      if (attempt !== this.playbackAttempt) return false;
      this.playbackPending = false;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        this.setStatus("blocked");
        return false;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.setStatus("error");
      this.callbacks.onError(`BGM 播放失败：${message}`);
      return false;
    }
  }

  private cancelPlaybackAttempt() {
    this.playbackAttempt += 1;
    this.playbackPending = false;
  }

  private ensureSource() {
    if (this.sourceAssigned) return;
    this.audio.src = BGM.path;
    this.sourceAssigned = true;
  }

  private setStatus(status: BgmStatus) {
    if (this.status === status) return;
    this.status = status;
    this.callbacks.onStatusChange(status);
  }
}
