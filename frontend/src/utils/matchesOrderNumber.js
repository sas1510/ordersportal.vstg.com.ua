export const matchesOrderNumber = (number, query) => {
  const value = String(number || "").toLowerCase();
  const search = String(query || "").toLowerCase().trim();
  if (!search) return true;

  return value.includes(search) || value.replace(/[-‐‑‒–—]/g, "")
    .includes(search.replace(/[-‐‑‒–—]/g, ""));
};
