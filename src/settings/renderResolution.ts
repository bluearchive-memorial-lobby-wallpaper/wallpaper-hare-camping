export type RenderResolution = "720p" | "1080p" | "1440p" | "2160p";

export const RENDER_RESOLUTIONS: Record<
  RenderResolution,
  { label: string; referenceWidth: number; height: number }
> = {
  "720p": { label: "720P", referenceWidth: 1280, height: 720 },
  "1080p": { label: "1080P", referenceWidth: 1920, height: 1080 },
  "1440p": { label: "2K", referenceWidth: 2560, height: 1440 },
  "2160p": { label: "4K", referenceWidth: 3840, height: 2160 },
};

export function isRenderResolution(value: unknown): value is RenderResolution {
  return value === "720p" || value === "1080p" || value === "1440p" || value === "2160p";
}
