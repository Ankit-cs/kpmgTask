export const MONUMENT_TYPO = {
  fontFamily: "'Monument Extended',sans-serif",
  canvasFontFamily: "'Monument Extended'",
  letterSpacing: {
    monument: "0.02em",
    displayTight: "-0.015em",
    displayWide: "-0.02em",
    metric: "0.02em",
    logo: "0.03em",
  },
};

export const getMonumentCanvasFont = (weight, size) => `${weight} ${size} ${MONUMENT_TYPO.canvasFontFamily},monospace`;
