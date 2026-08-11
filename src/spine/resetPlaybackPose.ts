export function resetAndApplyPlaybackPose(
  skeleton: any,
  state: any,
  configureTracks: () => void,
) {
  state.clearTracks();
  skeleton.setToSetupPose();
  configureTracks();
  state.apply(skeleton);
  skeleton.updateWorldTransform();
}
