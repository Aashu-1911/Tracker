export const getHeatmapClass = (value) => {
  if (!value || !value.value) {
    return "heatmap-empty";
  }

  if (value.value >= 90) {
    return "heatmap-peak";
  }
  if (value.value >= 70) {
    return "heatmap-high";
  }
  if (value.value >= 40) {
    return "heatmap-mid";
  }

  return "heatmap-low";
};

export const chartPalette = ["#e07a5f", "#2a9d8f", "#f2cc8f", "#81b29a", "#3d405b"];
