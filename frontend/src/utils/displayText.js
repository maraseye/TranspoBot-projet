/** Affichage sans accents (e au lieu de è, a au lieu de à, etc.) pour eviter problemes de police. */
export function asciiDisplay(value) {
  if (value == null || value === "") return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .replace(/ß/g, "ss");
}
