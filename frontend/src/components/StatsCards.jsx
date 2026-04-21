import {
  IconCompleted,
  IconInProgress,
  IconFleet,
  IconWrench,
  IconIncident,
  IconRevenue,
} from "./Icons.jsx";
import { formatFCFA } from "../utils/money.js";

const statConfig = [
  {
    key: "total_trajets",
    label: "Trajets terminés",
    color: "#38bdf8",
    Icon: IconCompleted,
    format: null,
  },
  {
    key: "trajets_en_cours",
    label: "En cours",
    color: "#fbbf24",
    Icon: IconInProgress,
    format: null,
  },
  {
    key: "vehicules_actifs",
    label: "Véhicules actifs",
    color: "#a78bfa",
    Icon: IconFleet,
    format: null,
  },
  {
    key: "vehicules_maintenance",
    label: "En maintenance",
    color: "#f97316",
    Icon: IconWrench,
    format: null,
  },
  {
    key: "incidents_ouverts",
    label: "Incidents ouverts",
    color: "#fb7185",
    Icon: IconIncident,
    format: null,
  },
  {
    key: "recette_mois",
    label: "Recette du mois",
    color: "#34d399",
    Icon: IconRevenue,
    format: formatFCFA,
  },
];

export default function StatsCards({ stats, onStatClick }) {
  return (
    <div className="statsGrid">
      {statConfig.map(({ key, label, color, Icon, format }) => {
        const val = stats?.[key] ?? null;
        return (
          <button
            key={key}
            type="button"
            className="statBox"
            style={{ "--accent": color }}
            onClick={() => onStatClick?.(key, label)}
            aria-label={`${label} — voir le détail`}
          >
            <div className="statIconWrap" style={{ color }}>
              <Icon size={28} />
            </div>
            <div className="statVal">
              {val !== null ? (format ? format(val) : val.toLocaleString("fr-FR")) : "—"}
            </div>
            <div className="statLbl">{label}</div>
            <span className="statHint">Voir le détail</span>
          </button>
        );
      })}
    </div>
  );
}
