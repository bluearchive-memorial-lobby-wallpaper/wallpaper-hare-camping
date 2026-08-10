export const MODEL_RESOLUTIONS = {
  "2k": { label: "2K", textureScale: 1 },
  "4k": { label: "4K", textureScale: 2 },
  "8k": { label: "8K", textureScale: 4 },
} as const;

export type ModelResolution = keyof typeof MODEL_RESOLUTIONS;

export function isModelResolution(value: unknown): value is ModelResolution {
  return typeof value === "string" && value in MODEL_RESOLUTIONS;
}
