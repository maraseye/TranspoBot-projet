import { useMemo, useState } from "react";
import Modal from "./Modal.jsx";
import DashboardVehicules from "./DashboardVehicules.jsx";
import DashboardChauffeurs from "./DashboardChauffeurs.jsx";
import DashboardLignes from "./DashboardLignes.jsx";
import { textMatchesQuery } from "../utils/search.js";

const TITLES = {
  vehicules: "Tous les véhicules",
  chauffeurs: "Tous les chauffeurs",
  lignes: "Toutes les lignes",
};

const SUBS = {
  vehicules: "Flotte complète — cliquez sur une carte pour la fiche détaillée",
  chauffeurs: "Équipe complète — cliquez sur une carte pour la fiche détaillée",
  lignes: "Réseau complet — cliquez sur une carte pour les tarifs et le parcours",
};

function filterVehicules(list, q) {
  if (!list) return null;
  if (!q.trim()) return list;
  return list.filter((v) =>
    textMatchesQuery(
      [v.immatriculation, v.type, v.statut, v.capacite != null ? String(v.capacite) : ""].join(" "),
      q,
    ),
  );
}

function filterChauffeurs(list, q) {
  if (!list) return null;
  if (!q.trim()) return list;
  return list.filter((c) =>
    textMatchesQuery(
      [c.prenom, c.nom, c.immatriculation, c.categorie_permis].filter(Boolean).join(" "),
      q,
    ),
  );
}

function filterLignes(list, q) {
  if (!list) return null;
  if (!q.trim()) return list;
  return list.filter((l) =>
    textMatchesQuery(
      [l.code, l.nom, l.origine, l.destination].filter(Boolean).join(" "),
      q,
    ),
  );
}

export default function EntityListModal({ kind, vehicules, chauffeurs, lignes, onClose, onSelectVehicule, onSelectChauffeur, onSelectLigne }) {
  const [query, setQuery] = useState("");

  const filteredVehicules = useMemo(() => filterVehicules(vehicules, query), [vehicules, query]);
  const filteredChauffeurs = useMemo(() => filterChauffeurs(chauffeurs, query), [chauffeurs, query]);
  const filteredLignes = useMemo(() => filterLignes(lignes, query), [lignes, query]);

  if (!kind) return null;

  const q = query.trim();
  const noSearchResults =
    q &&
    ((kind === "vehicules" && filteredVehicules && filteredVehicules.length === 0) ||
      (kind === "chauffeurs" && filteredChauffeurs && filteredChauffeurs.length === 0) ||
      (kind === "lignes" && filteredLignes && filteredLignes.length === 0));

  return (
    <Modal title={TITLES[kind]} subtitle={SUBS[kind]} onClose={onClose} wide>
      <div className="entitySearchRow">
        <label className="entitySearchLabel" htmlFor="entity-search">
          Rechercher
        </label>
        <input
          id="entity-search"
          type="search"
          className="entitySearchInput"
          placeholder="Nom, immatriculation, ligne, ville…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="entityListModalScroll">
        {noSearchResults ? (
          <div className="muted entitySearchEmpty">Aucun résultat pour cette recherche.</div>
        ) : (
          <>
            {kind === "vehicules" ? (
              <DashboardVehicules vehicules={filteredVehicules} onSelect={onSelectVehicule} />
            ) : null}
            {kind === "chauffeurs" ? (
              <DashboardChauffeurs chauffeurs={filteredChauffeurs} onSelect={onSelectChauffeur} />
            ) : null}
            {kind === "lignes" ? <DashboardLignes lignes={filteredLignes} onSelect={onSelectLigne} /> : null}
          </>
        )}
      </div>
    </Modal>
  );
}
