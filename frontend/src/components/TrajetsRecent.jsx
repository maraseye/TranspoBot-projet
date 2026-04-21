function statusBadgeClass(statut) {
  const s = (statut || "").toLowerCase();
  if (s === "termine") return "badge badge-green";
  if (s === "en_cours") return "badge badge-orange";
  return "badge badge-red";
}

import { useState } from "react";

function chauffeurDisplay(t) {
  const p = (t.chauffeur_prenom || "").trim();
  const n = (t.chauffeur_nom || "").trim();
  if (p && n) return `${p} ${n}`;
  if (n) return n;
  if (p) return p;
  return "—";
}

const PREVIEW_COUNT = 15;

export default function TrajetsRecent({ trajets, onSelectTrajet }) {
  const [expanded, setExpanded] = useState(false);

  if (!trajets) return <div className="muted">Chargement…</div>;
  if (!trajets.length) return <div className="muted">Aucun trajet</div>;

  const hasMore = trajets.length > PREVIEW_COUNT;
  const visible = expanded || !hasMore ? trajets : trajets.slice(0, PREVIEW_COUNT);

  const rows = visible.map((t) => {
    const date = t.date_heure_depart ? new Date(t.date_heure_depart) : null;
    const frDate = date ? date.toLocaleDateString("fr-FR") : "";
    const frTime = date ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

    return (
      <tr
        key={t.id}
        className="trajetRow trajetRow--clickable"
        onClick={() => onSelectTrajet?.(t.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectTrajet?.(t.id);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Détail trajet ${t.ligne ?? ""}`}
      >
        <td className="tdText">{t.ligne ?? "—"}</td>
        <td className="tdText">{chauffeurDisplay(t)}</td>
        <td>
          <div>{frDate}</div>
          <div className="muted">{frTime}</div>
        </td>
        <td>
          <span className={statusBadgeClass(t.statut)}>{t.statut ?? "—"}</span>
        </td>
      </tr>
    );
  });

  return (
    <div className="tableWrap trajetsTableWrap">
      <table className="trajetsTable">
        <thead>
          <tr>
            <th>Ligne</th>
            <th>Chauffeur</th>
            <th>Date</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      {hasMore && !expanded ? (
        <div className="trajetsVoirPlusRow">
          <button type="button" className="trajetsVoirPlusBtn" onClick={() => setExpanded(true)}>
            Voir plus
          </button>
        </div>
      ) : null}
    </div>
  );
}
