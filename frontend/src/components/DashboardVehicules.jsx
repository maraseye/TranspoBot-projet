import { IconFleet } from "./Icons.jsx";
import { asciiDisplay } from "../utils/displayText.js";

function accent(statut) {
  const s = (statut || "").toLowerCase();
  if (s === "actif") return "#34d399";
  if (s === "maintenance") return "#fbbf24";
  if (s === "hors_service") return "#fb7185";
  return "#94a3b8";
}

export default function DashboardVehicules({ vehicules, onSelect }) {
  if (!vehicules) return <div className="muted">Chargement…</div>;
  if (!vehicules.length) return <div className="muted">Aucun véhicule</div>;

  return (
    <div className="miniDashGrid">
      {vehicules.map((v) => (
        <button
          key={v.id}
          type="button"
          className="miniDashCard"
          style={{ "--accent": accent(v.statut) }}
          onClick={() => onSelect?.(v.id)}
          aria-label={`Fiche véhicule ${v.immatriculation}`}
        >
          <div className="miniDashCard__iconWrap" style={{ color: "var(--accent)" }}>
            <IconFleet size={22} />
          </div>
          <div className="miniDashCard__title">{asciiDisplay(String(v.immatriculation ?? "—"))}</div>
          <div className="miniDashCard__meta">
            {asciiDisplay(String(v.type ?? "—"))} · {v.capacite != null ? `${v.capacite} pl.` : "—"}
          </div>
          <div className="miniDashCard__badge">{asciiDisplay(String(v.statut ?? "—"))}</div>
          <span className="miniDashCard__hint">Voir le détail</span>
        </button>
      ))}
    </div>
  );
}
