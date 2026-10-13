export function findOrderZkz(files, number) {
  const normalize = (value) => String(value || "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  const key = normalize(number);
  if (!key) return null;
  return (files || []).filter((file) => /\.zkz$/i.test(file.fileName || "") && normalize(file.fileName.replace(/\.zkz$/i, "")) === key)
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))[0] || null;
}
