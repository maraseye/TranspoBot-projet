import { IconUsers } from "./Icons.jsx";
import { asciiDisplay } from "../utils/displayText.js";

function accentDispo(d) {
  if (d === true || d === 1) return "#34d399";
  if (d === false || d === 0) return "#fbbf24";
  return "#94a3b8";
}

export default function DashboardChauffeurs({ chauffeurs, onSelect }) {
  if (!chauffeurs) return <div className="muted">Chargement…</div>;
  if (!chauffeurs.length) return <div className="muted">Aucun chauffeur</div>;

  return (
    <div className="miniDashGrid">
      {chauffeurs.map((c) => (
        <button
          key={c.id}
          type="button"
          className="miniDashCard"
          style={{ "--accent": accentDispo(c.disponibilite) }}
          onClick={() => onSelect?.(c.id)}
          aria-label={`Fiche ${c.prenom} ${c.nom}`}
        >
          <div className="miniDashCard__iconWrap" style={{ color: "var(--accent)" }}>
            <IconUsers size={22} />
          </div>
          <div className="miniDashCard__title">
            {asciiDisplay(c.prenom)} {asciiDisplay(c.nom)}
          </div>
          <div className="miniDashCard__meta">
            {c.immatriculation ? `Veh. ${asciiDisplay(c.immatriculation)}` : "Sans vehicule"}
          </div>
          <div className="miniDashCard__badge">{c.disponibilite === true || c.disponibilite === 1 ? "Disponible" : "Indisponible"}</div>
          <span className="miniDashCard__hint">Voir le détail</span>
        </button>
      ))}
    </div>
  );
}
