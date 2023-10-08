export function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = Math.max(0, canvas.clientWidth - 200);
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
