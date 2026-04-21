import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { formatFCFA } from "../utils/money.js";

function fmtDT(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(v);
  }
}

function boolFr(b) {
  if (b === true || b === 1) return "Oui";
  if (b === false || b === 0) return "Non";
  return "—";
}

export default function VehiculeDetailModal({ data, loading, error, onClose, onOpenTrajet, onVehiculeStatutChange }) {
  const v = data?.vehicule;
  const chauffeurs = data?.chauffeurs_assignes ?? [];
  const trajets = data?.trajets_recents ?? [];
  const [nextStatut, setNextStatut] = useState("");
  const [savingStatut, setSavingStatut] = useState(false);

  useEffect(() => {
    setNextStatut(v?.statut || "");
  }, [v?.id, v?.statut]);

  async function submitStatutChange() {
    if (!v?.id || !onVehiculeStatutChange) return;
    const target = String(nextStatut || "").toLowerCase();
    const current = String(v.statut || "").toLowerCase();
    if (!target || target === current) return;
    setSavingStatut(true);
    try {
      await onVehiculeStatutChange(v.id, target);
    } finally {
      setSavingStatut(false);
    }
  }

  return (
    <Modal
      title={v ? `Véhicule ${v.immatriculation || ""}` : "Véhicule"}
      subtitle="Fiche flotte & historique"
      onClose={onClose}
      wide
    >
      {loading ? <div className="modalLoading">Chargement…</div> : null}
      {error ? <div className="modalError">{error}</div> : null}
      {v ? (
        <>
          <div className="trajetDetailGrid">
            <section className="detailCard detailCard--full">
              <h3 className="detailCardTitle">Caractéristiques</h3>
              <dl className="detailList detailList--cols">
                <div>
                  <dt>Immatriculation</dt>
                  <dd>{v.immatriculation ?? "—"}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{v.type ?? "—"}</dd>
                </div>
                <div>
                  <dt>Capacité</dt>
                  <dd>{v.capacite != null ? `${v.capacite} places` : "—"}</dd>
                </div>
                <div>
                  <dt>Statut</dt>
                  <dd>
                    {onVehiculeStatutChange ? (
                      <div className="statTrajetActions statTrajetActions--wrap">
                        <select
                          className="statTrajetStatutSelect"
                          value={nextStatut}
                          disabled={savingStatut}
                          onChange={(e) => setNextStatut(e.target.value)}
                          aria-label="Statut du véhicule"
                        >
                          <option value="actif">Actif</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="hors_service">Hors service</option>
                        </select>
                        <button
                          type="button"
                          className="btnStatTrajet btnStatTrajet--done"
                          disabled={savingStatut || String(nextStatut || "").toLowerCase() === String(v.statut || "").toLowerCase()}
                          onClick={submitStatutChange}
                        >
                          {savingStatut ? "…" : "Appliquer"}
                        </button>
                      </div>
                    ) : (
                      v.statut ?? "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Kilométrage</dt>
                  <dd>{v.kilometrage != null ? `${v.kilometrage.toLocaleString("fr-FR")} km` : "—"}</dd>
                </div>
                <div>
                  <dt>Mise en service</dt>
                  <dd>{v.date_acquisition ? String(v.date_acquisition) : "—"}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="detailCard detailCard--full" style={{ marginTop: 14 }}>
            <h3 className="detailCardTitle">Chauffeur(s) assigné(s) ({chauffeurs.length})</h3>
            {chauffeurs.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Aucun chauffeur n’est assigné à ce véhicule.
              </p>
            ) : (
              <ul className="incidentList" style={{ gap: 8 }}>
                {chauffeurs.map((c) => (
                  <li key={c.id} className="incidentItem" style={{ borderColor: "rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.08)" }}>
                    <strong>
                      {c.prenom} {c.nom}
                    </strong>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      Permis {c.categorie_permis ?? "—"}
                    </span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      Dispo : {boolFr(c.disponibilite)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="detailCard detailCard--full" style={{ marginTop: 14 }}>
            <h3 className="detailCardTitle">Derniers trajets ({trajets.length})</h3>
            {trajets.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Aucun trajet enregistré pour ce véhicule.
              </p>
            ) : (
              <div className="tableWrap modalTableWrap">
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>Ligne</th>
                      <th>Chauffeur</th>
                      <th>Départ</th>
                      <th>Statut</th>
                      <th>Recette</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {trajets.map((t) => (
                      <tr key={t.id}>
                        <td className="tdText">{t.ligne ?? "—"}</td>
                        <td className="tdText">
                          {[t.chauffeur_prenom, t.chauffeur_nom].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td>{fmtDT(t.date_heure_depart)}</td>
                        <td>{t.statut ?? "—"}</td>
                        <td>{formatFCFA(t.recette)}</td>
                        <td>
                          {onOpenTrajet ? (
                            <button type="button" className="linkishBtn" onClick={() => onOpenTrajet(t.id)}>
                              Détail
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </Modal>
  );
}
