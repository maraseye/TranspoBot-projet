import Modal from "./Modal.jsx";
import { formatFCFA } from "../utils/money.js";

export default function LigneDetailModal({ data, loading, error, onClose }) {
  const ligne = data?.ligne;
  const tarifs = data?.tarifs ?? [];
  const nbTrajets = data?.nb_trajets_total;

  return (
    <Modal
      title={ligne ? `${ligne.code || ""} — ${ligne.nom || "Ligne"}`.trim() : "Ligne"}
      subtitle="Détail et tarifs"
      onClose={onClose}
      wide
    >
      {loading ? <div className="modalLoading">Chargement…</div> : null}
      {error ? <div className="modalError">{error}</div> : null}
      {ligne ? (
        <>
          <div className="trajetDetailGrid">
            <section className="detailCard detailCard--full">
              <h3 className="detailCardTitle">Parcours</h3>
              <dl className="detailList detailList--cols">
                <div>
                  <dt>Code</dt>
                  <dd>{ligne.code ?? "—"}</dd>
                </div>
                <div>
                  <dt>Nom</dt>
                  <dd>{ligne.nom ?? "—"}</dd>
                </div>
                <div>
                  <dt>Origine → Destination</dt>
                  <dd>
                    {ligne.origine ?? "—"} → {ligne.destination ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>Distance</dt>
                  <dd>{ligne.distance_km != null ? `${ligne.distance_km} km` : "—"}</dd>
                </div>
                <div>
                  <dt>Durée indicative</dt>
                  <dd>{ligne.duree_minutes != null ? `${ligne.duree_minutes} min` : "—"}</dd>
                </div>
                <div>
                  <dt>Trajets en base</dt>
                  <dd>{nbTrajets ?? "—"}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="detailCard detailCard--full" style={{ marginTop: 14 }}>
            <h3 className="detailCardTitle">Tarifs ({tarifs.length})</h3>
            {tarifs.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Aucun tarif.
              </p>
            ) : (
              <div className="tableWrap modalTableWrap">
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>Type client</th>
                      <th>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarifs.map((t) => (
                      <tr key={t.id ?? `${t.ligne_id}-${t.type_client}`}>
                        <td>{t.type_client ?? "—"}</td>
                        <td>{formatFCFA(t.prix)}</td>
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
