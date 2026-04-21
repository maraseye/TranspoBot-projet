/** Recherche insensible aux accents et à la casse. */
export function normalizeForSearch(s) {
  if (s == null || s === "") return "";
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function textMatchesQuery(text, query) {
  const q = normalizeForSearch(query).trim();
  if (!q) return true;
  return normalizeForSearch(text).includes(q);
}
