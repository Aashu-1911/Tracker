export const CATEGORY_COLORS = {
  overall: "#e07a5f",
  work: "#3d405b",
  health: "#2a9d8f",
  personal: "#f4a261",
  learning: "#81b29a",
  other: "#8d6e63",
};

export const HEATMAP_LEVELS = ["#edf6f1", "#cfe9da", "#92c9ab", "#4ea978", "#1f7a4f"];

export const getHeatmapColor = (value) => {
  if (value >= 100) {
    return HEATMAP_LEVELS[4];
  }
  if (value >= 75) {
    return HEATMAP_LEVELS[3];
  }
  if (value >= 50) {
    return HEATMAP_LEVELS[2];
  }
  if (value >= 25) {
    return HEATMAP_LEVELS[1];
  }
  return HEATMAP_LEVELS[0];
};

export const chartPalette = Object.values(CATEGORY_COLORS);
