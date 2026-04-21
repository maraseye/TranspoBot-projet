import { IconRouteLine } from "./Icons.jsx";
import { asciiDisplay } from "../utils/displayText.js";

export default function DashboardLignes({ lignes, onSelect }) {
  if (!lignes) return <div className="muted">Chargement…</div>;
  if (!lignes.length) return <div className="muted">Aucune ligne</div>;

  return (
    <div className="miniDashGrid">
      {lignes.map((l) => (
        <button
          key={l.id}
          type="button"
          className="miniDashCard miniDashCard--route"
          style={{ "--accent": "#60a5fa" }}
          onClick={() => onSelect?.(l.id)}
          aria-label={`Fiche ligne ${l.code}`}
        >
          <div className="miniDashCard__iconWrap" style={{ color: "var(--accent)" }}>
            <IconRouteLine size={22} />
          </div>
          <div className="miniDashCard__title">{asciiDisplay(String(l.code ?? "—"))}</div>
          <div className="miniDashCard__meta tdText">{asciiDisplay(String(l.nom ?? "—"))}</div>
          <div className="miniDashCard__badge tdText">
            {asciiDisplay(String(l.origine ?? "—"))} → {asciiDisplay(String(l.destination ?? "—"))}
          </div>
          <span className="miniDashCard__hint">Tarifs & detail</span>
        </button>
      ))}
    </div>
  );
}
