import { IconFleet, IconUsers, IconRouteLine } from "./Icons.jsx";

const TILES = [
  {
    key: "vehicules",
    label: "Véhicules",
    hint: "Voir toute la flotte",
    color: "#a78bfa",
    Icon: IconFleet,
    count: (data) => data?.length,
  },
  {
    key: "chauffeurs",
    label: "Chauffeurs",
    hint: "Voir tous les chauffeurs",
    color: "#38bdf8",
    Icon: IconUsers,
    count: (data) => data?.length,
  },
  {
    key: "lignes",
    label: "Lignes",
    hint: "Voir toutes les lignes",
    color: "#34d399",
    Icon: IconRouteLine,
    count: (data) => data?.length,
  },
];

export default function DashboardEntityTiles({ vehicules, chauffeurs, lignes, onOpen }) {
  const dataMap = { vehicules, chauffeurs, lignes };

  return (
    <div className="statsGrid statsGrid--entities">
      {TILES.map(({ key, label, hint, color, Icon, count }) => {
        const n = count(dataMap[key]);
        const val = n != null ? n.toLocaleString("fr-FR") : "—";
        return (
          <button
            key={key}
            type="button"
            className="statBox"
            style={{ "--accent": color }}
            onClick={() => onOpen?.(key)}
            aria-label={`${label} — ${hint}`}
          >
            <div className="statIconWrap" style={{ color }}>
              <Icon size={28} />
            </div>
            <div className="statVal">{val}</div>
            <div className="statLbl">{label}</div>
            <span className="statHint">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
