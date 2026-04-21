/** Montants en franc CFA (Sénégal / UEMOA), jamais en euro. */
export function formatFCFA(value) {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
  const unit = Math.abs(n) === 1 ? "franc CFA" : "francs CFA";
  return `${formatted}\u00a0${unit}`;
}
