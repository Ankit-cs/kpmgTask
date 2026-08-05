export function observeElementResize(element, onResize) {
  if (!element || typeof onResize !== "function") {
    return () => {};
  }

  let disposed = false;
  let frameId = 0;
  let lastWidth = -1;
  let lastHeight = -1;

  const run = () => {
    frameId = 0;
    if (disposed) return;

    const width = element.clientWidth || element.offsetWidth || 0;
    const height = element.clientHeight || element.offsetHeight || 0;
    if (!width || !height) return;

    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;
    onResize();
  };

  const schedule = () => {
    if (disposed || frameId) return;
    frameId = window.requestAnimationFrame(run);
  };

  schedule();

  let observer;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      schedule();
    });
    observer.observe(element);
  }

  return () => {
    disposed = true;
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    observer?.disconnect();
  };
}
