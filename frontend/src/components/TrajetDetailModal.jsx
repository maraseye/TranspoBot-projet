import { useState } from "react";
import Modal from "./Modal.jsx";
import { IconBus } from "./Icons.jsx";
import { formatFCFA } from "../utils/money.js";

function statusBadgeClass(statut) {
  const s = (statut || "").toLowerCase();
  if (s === "termine") return "badge badge-green";
  if (s === "en_cours") return "badge badge-orange";
  if (s === "planifie") return "badge badge-blue";
  return "badge badge-red";
}

function fmtDateTime(v) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(v);
  }
}

function isIncidentUnresolved(i) {
  return !(i.resolu === true || i.resolu === 1);
}

export default function TrajetDetailModal({
  data,
  loading,
  error,
  onClose,
  onTerminerTrajet,
  onDeclarerIncidentTrajet,
  onIncidentResolu,
}) {
  const t = data?.trajet;
  const incidents = data?.incidents ?? [];
  const incidentsOuverts = incidents.filter(isIncidentUnresolved);
  const [termineBusy, setTermineBusy] = useState(false);
  const [busyIncidentId, setBusyIncidentId] = useState(null);
  const showActions =
    t &&
    String(t.statut || "").toLowerCase() === "en_cours" &&
    (onTerminerTrajet || onDeclarerIncidentTrajet);

  async function handleTerminer() {
    if (!onTerminerTrajet || !t?.id) return;
    setTermineBusy(true);
    try {
      await onTerminerTrajet(t.id);
    } catch {
      /* erreur affichee dans App */
    } finally {
      setTermineBusy(false);
    }
  }

  async function handleIncidentResolu(incidentId) {
    if (!onIncidentResolu) return;
    setBusyIncidentId(incidentId);
    try {
      await onIncidentResolu(incidentId);
    } catch {
      /* erreur affichee dans App */
    } finally {
      setBusyIncidentId(null);
    }
  }

  return (
    <Modal
      title={
        t
          ? `${t.ligne_code ?? "—"} · ${fmtDateTime(t.date_heure_depart)}`
          : "Trajet"
      }
      subtitle="Détails du trajet"
      onClose={onClose}
      wide
    >
      {loading ? <div className="modalLoading">Chargement…</div> : null}
      {error ? <div className="modalError">{error}</div> : null}
      {t ? (
        <div className="trajetDetailGrid">
          <section className="detailCard">
            <h3 className="detailCardTitle">
              <IconBus size={18} /> Ligne
            </h3>
            <dl className="detailList">
              <div>
                <dt>Nom</dt>
                <dd>{t.ligne ?? "—"}</dd>
              </div>
              <div>
                <dt>Code</dt>
                <dd>{t.ligne_code ?? "—"}</dd>
              </div>
              <div>
                <dt>Parcours</dt>
                <dd>
                  {t.origine ?? "—"} → {t.destination ?? "—"}
                </dd>
              </div>
              {t.distance_km != null ? (
                <div>
                  <dt>Distance</dt>
                  <dd>{t.distance_km} km</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="detailCard">
            <h3 className="detailCardTitle">Chauffeur</h3>
            <dl className="detailList">
              <div>
                <dt>Nom complet</dt>
                <dd>
                  {[t.chauffeur_prenom, t.chauffeur_nom].filter(Boolean).join(" ") || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="detailCard">
            <h3 className="detailCardTitle">Véhicule</h3>
            <dl className="detailList">
              <div>
                <dt>Immatriculation</dt>
                <dd>{t.immatriculation ?? "—"}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{t.vehicule_type ?? "—"}</dd>
              </div>
              {t.vehicule_capacite != null ? (
                <div>
                  <dt>Capacité</dt>
                  <dd>{t.vehicule_capacite} places</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="detailCard detailCard--full">
            <h3 className="detailCardTitle">Horaires & statut</h3>
            <dl className="detailList detailList--cols">
              <div>
                <dt>Départ</dt>
                <dd>{fmtDateTime(t.date_heure_depart)}</dd>
              </div>
              <div>
                <dt>Arrivée</dt>
                <dd>{fmtDateTime(t.date_heure_arrivee)}</dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>
                  <span className={statusBadgeClass(t.statut)}>{t.statut ?? "—"}</span>
                </dd>
              </div>
              <div>
                <dt>Passagers</dt>
                <dd>{t.nb_passagers ?? "—"}</dd>
              </div>
              <div>
                <dt>Recette</dt>
                <dd>{formatFCFA(t.recette)}</dd>
              </div>
            </dl>
          </section>

          {showActions ? (
            <section className="detailCard detailCard--full trajetActionsCard">
              <h3 className="detailCardTitle">Actions</h3>
              <div className="statTrajetActions">
                {onTerminerTrajet ? (
                  <button
                    type="button"
                    className="btnStatTrajet btnStatTrajet--done"
                    disabled={termineBusy}
                    onClick={handleTerminer}
                  >
                    {termineBusy ? "…" : "Termine"}
                  </button>
                ) : null}
                {onDeclarerIncidentTrajet ? (
                  <button
                    type="button"
                    className="btnStatTrajet btnStatTrajet--alert"
                    disabled={termineBusy}
                    onClick={() => onDeclarerIncidentTrajet(t.id)}
                  >
                    Incident
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="detailCard detailCard--full">
            <h3 className="detailCardTitle">Incidents non résolus ({incidentsOuverts.length})</h3>
            {incidents.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Aucun incident enregistré pour ce trajet.
              </p>
            ) : incidentsOuverts.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Tous les incidents liés à ce trajet sont résolus.
              </p>
            ) : (
              <ul className="incidentList">
                {incidentsOuverts.map((i) => (
                  <li key={i.id} className="incidentItem incidentItem--withAction">
                    <div className="incidentItemMain">
                      <span className="incidentType">{i.type}</span>
                      <span className="incidentGrav">{i.gravite}</span>
                      <span className="muted">{fmtDateTime(i.date_incident)}</span>
                      {i.description ? <p className="incidentDesc">{i.description}</p> : null}
                    </div>
                    {onIncidentResolu ? (
                      <button
                        type="button"
                        className="btnStatTrajet btnStatTrajet--done incidentResoluBtn"
                        disabled={busyIncidentId != null}
                        onClick={() => handleIncidentResolu(i.id)}
                      >
                        {busyIncidentId === i.id ? "…" : "Résolu"}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
