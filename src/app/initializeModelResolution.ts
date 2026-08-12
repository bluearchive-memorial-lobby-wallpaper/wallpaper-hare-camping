import type { ModelResolution } from "../settings/modelResolution";

interface StableModelInitializationOptions {
  getTargetResolution: () => ModelResolution;
  initialize: (resolution: ModelResolution) => Promise<unknown>;
  switchResolution: (resolution: ModelResolution) => Promise<unknown>;
}

export interface StableModelInitializationResult {
  resolution: ModelResolution;
  loadPasses: number;
}

export async function initializeStableModelResolution(
  options: StableModelInitializationOptions,
): Promise<StableModelInitializationResult> {
  let resolution = options.getTargetResolution();
  let loadPasses = 1;
  await options.initialize(resolution);

  while (options.getTargetResolution() !== resolution) {
    resolution = options.getTargetResolution();
    loadPasses += 1;
    await options.switchResolution(resolution);
  }

  return { resolution, loadPasses };
}
