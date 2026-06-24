export const formatNumber = (num) => {
  if (num === null || num === undefined || num === "") return "-";
  if (typeof num !== "number") return String(num);
  return num.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
};

export const formatPercent = (num) => {
  if (num === null || num === undefined || Number.isNaN(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
};
