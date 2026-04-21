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

export default function ChauffeurDetailModal({ data, loading, error, onClose, onOpenTrajet, onChauffeurDisponibiliteChange }) {
  const c = data?.chauffeur;
  const trajets = data?.trajets_recents ?? [];
  const [nextDisponibilite, setNextDisponibilite] = useState(true);
  const [savingDisponibilite, setSavingDisponibilite] = useState(false);

  useEffect(() => {
    setNextDisponibilite(Boolean(c?.disponibilite === true || c?.disponibilite === 1));
  }, [c?.id, c?.disponibilite]);

  async function submitDisponibilite() {
    if (!c?.id || !onChauffeurDisponibiliteChange) return;
    const cur = Boolean(c.disponibilite === true || c.disponibilite === 1);
    if (nextDisponibilite === cur) return;
    setSavingDisponibilite(true);
    try {
      await onChauffeurDisponibiliteChange(c.id, nextDisponibilite);
    } finally {
      setSavingDisponibilite(false);
    }
  }

  return (
    <Modal title={c ? `${c.prenom || ""} ${c.nom || ""}`.trim() || "Chauffeur" : "Chauffeur"} subtitle="Fiche complète" onClose={onClose} wide>
      {loading ? <div className="modalLoading">Chargement…</div> : null}
      {error ? <div className="modalError">{error}</div> : null}
      {c ? (
        <>
          <div className="trajetDetailGrid">
            <section className="detailCard">
              <h3 className="detailCardTitle">Identité</h3>
              <dl className="detailList">
                <div>
                  <dt>Prénom</dt>
                  <dd>{c.prenom ?? "—"}</dd>
                </div>
                <div>
                  <dt>Nom</dt>
                  <dd>{c.nom ?? "—"}</dd>
                </div>
                <div>
                  <dt>Téléphone</dt>
                  <dd className="muted">{"Non exposé par l'API (donnée personnelle)"}</dd>
                </div>
                <div>
                  <dt>N° permis</dt>
                  <dd className="muted">{"Non exposé par l'API (donnée personnelle)"}</dd>
                </div>
                <div>
                  <dt>Catégorie</dt>
                  <dd>{c.categorie_permis ?? "—"}</dd>
                </div>
                <div>
                  <dt>Disponible</dt>
                  <dd>
                    {onChauffeurDisponibiliteChange ? (
                      <div className="statTrajetActions statTrajetActions--wrap">
                        <select
                          className="statTrajetStatutSelect"
                          value={nextDisponibilite ? "disponible" : "indisponible"}
                          disabled={savingDisponibilite}
                          onChange={(e) => setNextDisponibilite(e.target.value === "disponible")}
                          aria-label="Disponibilité du chauffeur"
                        >
                          <option value="disponible">Disponible</option>
                          <option value="indisponible">Indisponible</option>
                        </select>
                        <button
                          type="button"
                          className="btnStatTrajet btnStatTrajet--done"
                          disabled={savingDisponibilite || nextDisponibilite === Boolean(c.disponibilite === true || c.disponibilite === 1)}
                          onClick={submitDisponibilite}
                        >
                          {savingDisponibilite ? "…" : "Appliquer"}
                        </button>
                      </div>
                    ) : (
                      boolFr(c.disponibilite)
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Embauche</dt>
                  <dd>{c.date_embauche ? String(c.date_embauche) : "—"}</dd>
                </div>
              </dl>
            </section>
            <section className="detailCard">
              <h3 className="detailCardTitle">Véhicule assigné</h3>
              <dl className="detailList">
                <div>
                  <dt>Immatriculation</dt>
                  <dd>{c.immatriculation ?? "—"}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{c.vehicule_type ?? "—"}</dd>
                </div>
                <div>
                  <dt>Statut véhicule</dt>
                  <dd>{c.vehicule_statut ?? "—"}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="detailCard detailCard--full" style={{ marginTop: 14 }}>
            <h3 className="detailCardTitle">Derniers trajets ({trajets.length})</h3>
            {trajets.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Aucun trajet enregistré.
              </p>
            ) : (
              <div className="tableWrap modalTableWrap">
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>Ligne</th>
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
