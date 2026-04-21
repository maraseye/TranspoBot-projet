import { useState } from "react";
import Modal from "./Modal.jsx";
import { formatFCFA } from "../utils/money.js";

function fmtDateTime(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(v);
  }
}

function fmtInt(v) {
  if (v == null) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("fr-FR");
}

function shiftMonth(y, m, delta) {
  const d = new Date(y, m - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const TRAJET_STATUT_OPTIONS = [
  { value: "en_cours", label: "En cours" },
  { value: "planifie", label: "Planifié" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
];

/** Colonnes et libellés pour chaque tuile du tableau de bord (infos utiles uniquement) */
const DETAIL_VIEWS = {
  total_trajets: {
    columns: [
      { label: "Ligne", get: (r) => r.ligne ?? "—" },
      { label: "Chauffeur", get: (r) => [r.chauffeur_prenom, r.chauffeur_nom].filter(Boolean).join(" ") || "—" },
      { label: "Départ", get: (r) => fmtDateTime(r.date_heure_depart) },
      { label: "Statut", get: (r) => r.statut ?? "—" },
      { label: "Recette", get: (r) => formatFCFA(r.recette) },
      { label: "Véhicule", get: (r) => r.immatriculation ?? "—" },
    ],
  },
  trajets_en_cours: {
    columns: [
      { label: "Ligne", get: (r) => r.ligne ?? "—" },
      { label: "Chauffeur", get: (r) => [r.chauffeur_prenom, r.chauffeur_nom].filter(Boolean).join(" ") || "—" },
      { label: "Départ", get: (r) => fmtDateTime(r.date_heure_depart) },
      { label: "Passagers", get: (r) => (r.nb_passagers != null ? String(r.nb_passagers) : "—") },
      { label: "Véhicule", get: (r) => r.immatriculation ?? "—" },
    ],
  },
  recette_totale: {
    columns: [
      { label: "Ligne", get: (r) => r.ligne ?? "—" },
      { label: "Chauffeur", get: (r) => [r.chauffeur_prenom, r.chauffeur_nom].filter(Boolean).join(" ") || "—" },
      { label: "Départ", get: (r) => fmtDateTime(r.date_heure_depart) },
      { label: "Recette", get: (r) => formatFCFA(r.recette) },
      { label: "Passagers", get: (r) => (r.nb_passagers != null ? String(r.nb_passagers) : "—") },
    ],
  },
  recette_mois: {
    columns: [
      { label: "Ligne", get: (r) => r.ligne ?? "—" },
      { label: "Chauffeur", get: (r) => [r.chauffeur_prenom, r.chauffeur_nom].filter(Boolean).join(" ") || "—" },
      { label: "Départ", get: (r) => fmtDateTime(r.date_heure_depart) },
      { label: "Recette", get: (r) => formatFCFA(r.recette) },
      { label: "Passagers", get: (r) => (r.nb_passagers != null ? String(r.nb_passagers) : "—") },
    ],
  },
  vehicules_actifs: {
    columns: [
      { label: "Immatriculation", get: (r) => r.immatriculation ?? "—" },
      { label: "Type", get: (r) => r.type ?? "—" },
      { label: "Places", get: (r) => (r.capacite != null ? String(r.capacite) : "—") },
      { label: "Statut", get: (r) => r.statut ?? "—" },
      { label: "Kilométrage", get: (r) => (r.kilometrage != null ? `${fmtInt(r.kilometrage)}\u00a0km` : "—") },
    ],
  },
  vehicules_maintenance: {
    columns: [
      { label: "Immatriculation", get: (r) => r.immatriculation ?? "—" },
      { label: "Type", get: (r) => r.type ?? "—" },
      { label: "Places", get: (r) => (r.capacite != null ? String(r.capacite) : "—") },
      { label: "Kilométrage", get: (r) => (r.kilometrage != null ? `${fmtInt(r.kilometrage)}\u00a0km` : "—") },
    ],
  },
  incidents_ouverts: {
    columns: [
      { label: "Type", get: (r) => r.type ?? "—" },
      { label: "Gravité", get: (r) => r.gravite ?? "—" },
      { label: "Ligne", get: (r) => r.ligne ?? "—" },
      { label: "Chauffeur", get: (r) => [r.chauffeur_prenom, r.chauffeur_nom].filter(Boolean).join(" ") || "—" },
      { label: "Date", get: (r) => fmtDateTime(r.date_incident) },
      {
        label: "Résumé",
        get: (r) => {
          const d = (r.description || "").trim();
          if (!d) return "—";
          return d.length > 100 ? `${d.slice(0, 97)}…` : d;
        },
      },
    ],
  },
};

export default function StatDetailModal({
  detail,
  loading,
  error,
  onClose,
  loadingTitle = "Chargement…",
  onTrajetStatutChange,
  onTrajetIncident,
  onIncidentResolu,
  onVehiculeStatutChange,
  onStatDetailReload,
}) {
  const rows = detail?.rows ?? [];
  const statKey = detail?.key;
  const view = statKey ? DETAIL_VIEWS[statKey] : null;
  const showTrajetActions = statKey === "trajets_en_cours" && (onTrajetStatutChange || onTrajetIncident);
  const showIncidentResolve = statKey === "incidents_ouverts" && onIncidentResolu;
  const showVehiculeMaintenanceActions = statKey === "vehicules_maintenance" && onVehiculeStatutChange;
  const isRecetteView = statKey === "recette_mois" || statKey === "recette_totale";
  const showRecetteToolbar = isRecetteView && typeof onStatDetailReload === "function";
  const [busyTrajetId, setBusyTrajetId] = useState(null);
  const [busyIncidentId, setBusyIncidentId] = useState(null);
  const [busyVehiculeId, setBusyVehiculeId] = useState(null);

  async function handleTrajetStatutChange(id, nextStatut) {
    if (!onTrajetStatutChange) return;
    const cur = String(rows.find((r) => r.id === id)?.statut || "").toLowerCase();
    if (String(nextStatut).toLowerCase() === cur) return;
    setBusyTrajetId(id);
    try {
      await onTrajetStatutChange(id, nextStatut);
    } catch {
      /* erreur deja affichee (alert) cote parent */
    } finally {
      setBusyTrajetId(null);
    }
  }

  async function handleIncidentResolu(id) {
    if (!onIncidentResolu) return;
    setBusyIncidentId(id);
    try {
      await onIncidentResolu(id);
    } catch {
      /* erreur deja affichee (alert) cote parent */
    } finally {
      setBusyIncidentId(null);
    }
  }

  async function handleVehiculeNouveauStatut(id, nextStatut) {
    if (!onVehiculeStatutChange) return;
    setBusyVehiculeId(id);
    try {
      await onVehiculeStatutChange(id, nextStatut);
    } catch {
      /* erreur deja affichee (alert) cote parent */
    } finally {
      setBusyVehiculeId(null);
    }
  }

  const extraColCount =
    (showTrajetActions ? 1 : 0) + (showIncidentResolve ? 1 : 0) + (showVehiculeMaintenanceActions ? 1 : 0);
  const colSpanEmpty = view ? view.columns.length + extraColCount : 1;

  return (
    <Modal
      title={detail?.title ?? loadingTitle}
      subtitle={detail?.description}
      onClose={onClose}
      wide
    >
      {loading ? <div className="modalLoading">Chargement des données…</div> : null}
      {error ? <div className="modalError">{error}</div> : null}
      {!loading && !error && showRecetteToolbar && detail?.year != null && detail?.month != null && statKey === "recette_mois" ? (
        <div className="recetteDetailToolbar">
          <button
            type="button"
            className="recetteNavBtn"
            onClick={() => onStatDetailReload("recette_mois", shiftMonth(detail.year, detail.month, -1))}
          >
            ← Mois précédent
          </button>
          <span className="recetteDetailToolbarLabel">
            {detail.sum_recette != null ? `Total : ${formatFCFA(detail.sum_recette)}` : null}
          </span>
          <button
            type="button"
            className="recetteNavBtn"
            onClick={() => onStatDetailReload("recette_mois", shiftMonth(detail.year, detail.month, 1))}
          >
            Mois suivant →
          </button>
          <button type="button" className="btnPrimary" onClick={() => onStatDetailReload("recette_totale")}>
            Recette totale
          </button>
        </div>
      ) : null}
      {!loading && !error && showRecetteToolbar && statKey === "recette_totale" ? (
        <div className="recetteDetailToolbar">
          <span className="recetteDetailToolbarLabel">
            {detail?.sum_recette != null ? `Total : ${formatFCFA(detail.sum_recette)}` : null}
          </span>
          <button type="button" className="btnPrimary" onClick={() => onStatDetailReload("recette_mois", {})}>
            Voir par mois
          </button>
        </div>
      ) : null}
      {!loading && !error && rows.length === 0 && !showRecetteToolbar ? (
        <p className="muted" style={{ margin: 0 }}>
          Aucune donnée à afficher.
        </p>
      ) : null}
      {!loading && !error && view && (rows.length > 0 || showRecetteToolbar) ? (
        <div className="tableWrap modalTableWrap">
          <table className="dataTable">
            <thead>
              <tr>
                {view.columns.map((c) => (
                  <th key={c.label}>{c.label}</th>
                ))}
                {showTrajetActions ? <th className="statActionsCol">Actions</th> : null}
                {showIncidentResolve ? <th className="statActionsCol">Action</th> : null}
                {showVehiculeMaintenanceActions ? <th className="statActionsCol">État</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="tdText muted" colSpan={colSpanEmpty}>
                    {showRecetteToolbar ? "Aucun trajet terminé pour cette période." : "—"}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id != null ? row.id : idx}>
                    {view.columns.map((c) => (
                      <td key={c.label} className="tdText">
                        {c.get(row)}
                      </td>
                    ))}
                    {showTrajetActions ? (
                      <td className="statActionsCell">
                        <div className="statTrajetActions statTrajetActions--wrap">
                          {onTrajetStatutChange ? (
                            <select
                              className="statTrajetStatutSelect"
                              aria-label="Changer le statut du trajet"
                              value={String(row.statut || "").toLowerCase()}
                              disabled={busyTrajetId != null}
                              onChange={(e) => handleTrajetStatutChange(row.id, e.target.value)}
                            >
                              {TRAJET_STATUT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          {onTrajetIncident ? (
                            <button
                              type="button"
                              className="btnStatTrajet btnStatTrajet--alert"
                              disabled={busyTrajetId != null}
                              onClick={() => onTrajetIncident(row.id)}
                            >
                              Incident
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                    {showIncidentResolve ? (
                      <td className="statActionsCell">
                        <button
                          type="button"
                          className="btnStatTrajet btnStatTrajet--done"
                          disabled={busyIncidentId != null}
                          onClick={() => handleIncidentResolu(row.id)}
                        >
                          {busyIncidentId === row.id ? "…" : "Résolu"}
                        </button>
                      </td>
                    ) : null}
                    {showVehiculeMaintenanceActions ? (
                      <td className="statActionsCell">
                        <div className="statTrajetActions statTrajetActions--wrap">
                          <button
                            type="button"
                            className="btnStatTrajet btnStatTrajet--done"
                            disabled={busyVehiculeId != null}
                            onClick={() => handleVehiculeNouveauStatut(row.id, "actif")}
                          >
                            {busyVehiculeId === row.id ? "…" : "Actif"}
                          </button>
                          <button
                            type="button"
                            className="btnStatTrajet btnStatTrajet--alert"
                            disabled={busyVehiculeId != null}
                            onClick={() => handleVehiculeNouveauStatut(row.id, "maintenance")}
                          >
                            {busyVehiculeId === row.id ? "…" : "Maintenance"}
                          </button>
                          <button
                            type="button"
                            className="btnStatTrajet btnStatTrajet--muted"
                            disabled={busyVehiculeId != null}
                            onClick={() => handleVehiculeNouveauStatut(row.id, "hors_service")}
                          >
                            {busyVehiculeId === row.id ? "…" : "Hors service"}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </Modal>
  );
}
