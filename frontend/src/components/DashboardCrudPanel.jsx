import { useCallback, useEffect, useState } from "react";
import { IconClose, IconSettings } from "./Icons.jsx";
import { asciiDisplay } from "../utils/displayText.js";
import {
  createChauffeur,
  updateChauffeur,
  deleteChauffeur,
  createVehicule,
  updateVehicule,
  deleteVehicule,
  createIncident,
  updateIncident,
  deleteIncident,
  fetchIncidents,
  fetchTrajetsList,
  fetchTrajetsManage,
  createLigne,
  updateLigne,
  deleteLigne,
  createTrajet,
  updateTrajet,
  deleteTrajet,
} from "../api.js";

const TABS = [
  { id: "lignes", label: "Lignes" },
  { id: "trajets", label: "Trajets" },
  { id: "chauffeurs", label: "Chauffeurs" },
  { id: "vehicules", label: "Vehicules" },
  { id: "incidents", label: "Incidents" },
];

function dateToDatetimeLocal(v) {
  if (v == null || v === "") return "";
  const s = String(v).replace(" ", "T");
  return s.length >= 16 ? s.slice(0, 16) : s;
}

export default function DashboardCrudPanel({ vehicules, chauffeurs, lignes, onReload }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("lignes");
  const [incidents, setIncidents] = useState(null);
  const [trajetsList, setTrajetsList] = useState(null);
  const [trajetsManage, setTrajetsManage] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAux = useCallback(async () => {
    try {
      const [inc, tr, trMan] = await Promise.all([fetchIncidents(), fetchTrajetsList(), fetchTrajetsManage()]);
      setIncidents(inc);
      setTrajetsList(tr);
      setTrajetsManage(trMan);
    } catch {
      setIncidents([]);
      setTrajetsList([]);
      setTrajetsManage([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadAux();
  }, [open, loadAux]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const refresh = useCallback(async () => {
    await onReload?.();
    await loadAux();
  }, [onReload, loadAux]);

  async function handleDeleteChauffeur(id) {
    if (!window.confirm("Supprimer ce chauffeur ?")) return;
    setErr("");
    try {
      await deleteChauffeur(id);
      setMsg("Enregistre.");
      await refresh();
    } catch (e) {
      setErr(e.message || "Erreur");
    }
  }

  async function handleDeleteVehicule(id) {
    if (!window.confirm("Supprimer ce vehicule ?")) return;
    setErr("");
    try {
      await deleteVehicule(id);
      setMsg("Enregistre.");
      await refresh();
    } catch (e) {
      setErr(e.message || "Erreur");
    }
  }

  async function handleDeleteIncident(id) {
    if (!window.confirm("Supprimer cet incident ?")) return;
    setErr("");
    try {
      await deleteIncident(id);
      setMsg("Enregistre.");
      await refresh();
    } catch (e) {
      setErr(e.message || "Erreur");
    }
  }

  async function handleDeleteLigne(id) {
    if (!window.confirm("Supprimer cette ligne ? (impossible si trajets ou tarifs lies)")) return;
    setErr("");
    try {
      await deleteLigne(id);
      setMsg("Enregistre.");
      await refresh();
    } catch (e) {
      setErr(e.message || "Erreur");
    }
  }

  async function handleDeleteTrajet(id) {
    if (!window.confirm("Supprimer ce trajet ? (impossible si incidents lies)")) return;
    setErr("");
    try {
      await deleteTrajet(id);
      setMsg("Enregistre.");
      await refresh();
    } catch (e) {
      setErr(e.message || "Erreur");
    }
  }

  const panelInner = (
    <div className="crudPanel crudPanel--modalInner">
      <p className="muted crudPanel__hint">
        Les suppressions echouent si des donnees liees existent encore (trajets, incidents, etc.).
      </p>
      <div className="crudTabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`crudTab ${tab === t.id ? "crudTab--active" : ""}`}
            onClick={() => {
              setTab(t.id);
              setMsg("");
              setErr("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {msg ? <div className="crudFlash crudFlash--ok">{msg}</div> : null}
      {err ? <div className="crudFlash crudFlash--err">{asciiDisplay(err)}</div> : null}

      {tab === "lignes" ? (
        <LigneCrud
          lignes={lignes}
          onSaved={async () => {
            setMsg("Enregistre.");
            await refresh();
          }}
          onError={(e) => setErr(e)}
          onClearFlash={() => {
            setMsg("");
            setErr("");
          }}
          onDelete={handleDeleteLigne}
        />
      ) : null}
      {tab === "trajets" ? (
        <TrajetCrud
          trajetsManage={trajetsManage}
          lignes={lignes}
          chauffeurs={chauffeurs}
          vehicules={vehicules}
          onSaved={async () => {
            setMsg("Enregistre.");
            await refresh();
          }}
          onError={(e) => setErr(e)}
          onClearFlash={() => {
            setMsg("");
            setErr("");
          }}
          onDelete={handleDeleteTrajet}
        />
      ) : null}
      {tab === "chauffeurs" ? (
        <ChauffeurCrud
          chauffeurs={chauffeurs}
          vehicules={vehicules}
          onSaved={async () => {
            setMsg("Enregistre.");
            await refresh();
          }}
          onError={(e) => setErr(e)}
          onClearFlash={() => {
            setMsg("");
            setErr("");
          }}
          onDelete={handleDeleteChauffeur}
        />
      ) : null}
      {tab === "vehicules" ? (
        <VehiculeCrud
          vehicules={vehicules}
          onSaved={async () => {
            setMsg("Enregistre.");
            await refresh();
          }}
          onError={(e) => setErr(e)}
          onClearFlash={() => {
            setMsg("");
            setErr("");
          }}
          onDelete={handleDeleteVehicule}
        />
      ) : null}
      {tab === "incidents" ? (
        <IncidentCrud
          incidents={incidents}
          trajetsList={trajetsList}
          onSaved={async () => {
            setMsg("Enregistre.");
            await refresh();
          }}
          onError={(e) => setErr(e)}
          onClearFlash={() => {
            setMsg("");
            setErr("");
          }}
          onDelete={handleDeleteIncident}
        />
      ) : null}
    </div>
  );

  if (!open) {
    return (
      <div className="managementTriggerWrap">
        <button type="button" className="btnManagement" onClick={() => setOpen(true)}>
          <IconSettings size={20} />
          <span>Gestion des donnees</span>
        </button>
        <p className="muted managementTriggerHint">Ajouter, modifier ou supprimer lignes, trajets, chauffeurs, vehicules et incidents.</p>
      </div>
    );
  }

  return (
    <div className="managementModalOverlay" role="presentation" onClick={() => setOpen(false)}>
      <div
        className="managementModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="managementModalTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="managementModalHeader">
          <h3 id="managementModalTitle">Gestion des donnees</h3>
          <button type="button" className="managementModalClose" onClick={() => setOpen(false)} aria-label="Fermer">
            <IconClose size={22} />
          </button>
        </div>
        <div className="managementModalBody">{panelInner}</div>
      </div>
    </div>
  );
}

function LigneCrud({ lignes, onSaved, onError, onClearFlash, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: "",
    nom: "",
    origine: "",
    destination: "",
    distance_km: "",
    duree_minutes: "",
  });

  function startEdit(l) {
    setEditing(l.id);
    onClearFlash?.();
    setForm({
      code: l.code || "",
      nom: l.nom || "",
      origine: l.origine || "",
      destination: l.destination || "",
      distance_km: l.distance_km != null ? String(l.distance_km) : "",
      duree_minutes: l.duree_minutes != null ? String(l.duree_minutes) : "",
    });
  }

  async function submit(e) {
    e.preventDefault();
    onClearFlash?.();
    const body = {
      code: form.code.trim(),
      nom: form.nom.trim() || null,
      origine: form.origine.trim(),
      destination: form.destination.trim(),
      distance_km: form.distance_km === "" ? null : Number(form.distance_km),
      duree_minutes: form.duree_minutes === "" ? null : Number(form.duree_minutes),
    };
    try {
      if (editing) {
        await updateLigne(editing, body);
      } else {
        await createLigne(body);
      }
      setEditing(null);
      setForm({ code: "", nom: "", origine: "", destination: "", distance_km: "", duree_minutes: "" });
      await onSaved();
    } catch (err) {
      onError(err.message || "Erreur");
    }
  }

  return (
    <div className="crudSection">
      <form className="crudForm" onSubmit={submit}>
        <div className="crudFormGrid">
          <label>
            Code
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required maxLength={10} />
          </label>
          <label>
            Nom
            <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </label>
          <label>
            Origine
            <input value={form.origine} onChange={(e) => setForm((f) => ({ ...f, origine: e.target.value }))} required />
          </label>
          <label>
            Destination
            <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} required />
          </label>
          <label>
            Distance (km)
            <input type="number" min={0} step="0.01" value={form.distance_km} onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value }))} />
          </label>
          <label>
            Duree (min)
            <input type="number" min={0} value={form.duree_minutes} onChange={(e) => setForm((f) => ({ ...f, duree_minutes: e.target.value }))} />
          </label>
        </div>
        <div className="crudFormActions">
          <button type="submit" className="btnPrimary">
            {editing ? "Mettre a jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setEditing(null);
                setForm({ code: "", nom: "", origine: "", destination: "", distance_km: "", duree_minutes: "" });
              }}
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>
      <div className="crudTableWrap">
        <table className="crudTable">
          <thead>
            <tr>
              <th>Code</th>
              <th>Trace</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(lignes || []).map((l) => (
              <tr key={l.id}>
                <td>{asciiDisplay(l.code)}</td>
                <td className="tdMuted">
                  {asciiDisplay(l.origine)} → {asciiDisplay(l.destination)}
                </td>
                <td>
                  <button type="button" className="linkishBtn" onClick={() => startEdit(l)}>
                    Modifier
                  </button>{" "}
                  <button type="button" className="linkishBtn linkishBtn--danger" onClick={() => onDelete(l.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrajetCrud({ trajetsManage, lignes, chauffeurs, vehicules, onSaved, onError, onClearFlash, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    ligne_id: "",
    chauffeur_id: "",
    vehicule_id: "",
    date_heure_depart: "",
    date_heure_arrivee: "",
    statut: "planifie",
    nb_passagers: 0,
    recette: 0,
  });

  function startEdit(t) {
    setEditing(t.id);
    onClearFlash?.();
    setForm({
      ligne_id: String(t.ligne_id),
      chauffeur_id: String(t.chauffeur_id),
      vehicule_id: String(t.vehicule_id),
      date_heure_depart: dateToDatetimeLocal(t.date_heure_depart),
      date_heure_arrivee: dateToDatetimeLocal(t.date_heure_arrivee),
      statut: t.statut || "planifie",
      nb_passagers: t.nb_passagers ?? 0,
      recette: t.recette != null ? Number(t.recette) : 0,
    });
  }

  async function submit(e) {
    e.preventDefault();
    onClearFlash?.();
    if (!form.ligne_id || !form.chauffeur_id || !form.vehicule_id || !form.date_heure_depart) {
      onError("Remplissez ligne, chauffeur, vehicule et date de depart.");
      return;
    }
    const dep = form.date_heure_depart.replace("T", " ");
    const arrRaw = form.date_heure_arrivee.trim();
    const arr = arrRaw ? arrRaw.replace("T", " ") : null;
    const body = {
      ligne_id: Number(form.ligne_id),
      chauffeur_id: Number(form.chauffeur_id),
      vehicule_id: Number(form.vehicule_id),
      date_heure_depart: dep,
      date_heure_arrivee: arr,
      statut: form.statut,
      nb_passagers: Number(form.nb_passagers) || 0,
      recette: Number(form.recette) || 0,
    };
    try {
      if (editing) {
        await updateTrajet(editing, body);
      } else {
        await createTrajet(body);
      }
      setEditing(null);
      setForm({
        ligne_id: "",
        chauffeur_id: "",
        vehicule_id: "",
        date_heure_depart: "",
        date_heure_arrivee: "",
        statut: "planifie",
        nb_passagers: 0,
        recette: 0,
      });
      await onSaved();
    } catch (err) {
      onError(err.message || "Erreur");
    }
  }

  if (!trajetsManage) return <div className="muted">Chargement des trajets…</div>;

  return (
    <div className="crudSection">
      <form className="crudForm" onSubmit={submit}>
        <div className="crudFormGrid">
          <label>
            Ligne
            <select value={form.ligne_id} onChange={(e) => setForm((f) => ({ ...f, ligne_id: e.target.value }))} required>
              <option value="">—</option>
              {(lignes || []).map((l) => (
                <option key={l.id} value={l.id}>
                  {asciiDisplay(l.code)} — {asciiDisplay(l.nom || "")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chauffeur
            <select value={form.chauffeur_id} onChange={(e) => setForm((f) => ({ ...f, chauffeur_id: e.target.value }))} required>
              <option value="">—</option>
              {(chauffeurs || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {asciiDisplay(c.prenom)} {asciiDisplay(c.nom)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vehicule
            <select value={form.vehicule_id} onChange={(e) => setForm((f) => ({ ...f, vehicule_id: e.target.value }))} required>
              <option value="">—</option>
              {(vehicules || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {asciiDisplay(v.immatriculation)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Depart
            <input
              type="datetime-local"
              value={form.date_heure_depart}
              onChange={(e) => setForm((f) => ({ ...f, date_heure_depart: e.target.value }))}
              required
            />
          </label>
          <label>
            Arrivee (optionnel)
            <input
              type="datetime-local"
              value={form.date_heure_arrivee}
              onChange={(e) => setForm((f) => ({ ...f, date_heure_arrivee: e.target.value }))}
            />
          </label>
          <label>
            Statut
            <select value={form.statut} onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}>
              <option value="planifie">planifie</option>
              <option value="en_cours">en_cours</option>
              <option value="termine">termine</option>
              <option value="annule">annule</option>
            </select>
          </label>
          <label>
            Passagers
            <input type="number" min={0} value={form.nb_passagers} onChange={(e) => setForm((f) => ({ ...f, nb_passagers: e.target.value }))} />
          </label>
          <label>
            Recette (FCFA)
            <input type="number" min={0} step="0.01" value={form.recette} onChange={(e) => setForm((f) => ({ ...f, recette: e.target.value }))} />
          </label>
        </div>
        <div className="crudFormActions">
          <button type="submit" className="btnPrimary">
            {editing ? "Mettre a jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setEditing(null);
                setForm({
                  ligne_id: "",
                  chauffeur_id: "",
                  vehicule_id: "",
                  date_heure_depart: "",
                  date_heure_arrivee: "",
                  statut: "planifie",
                  nb_passagers: 0,
                  recette: 0,
                });
              }}
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>
      <div className="crudTableWrap crudTableWrap--scroll">
        <table className="crudTable">
          <thead>
            <tr>
              <th>Ligne</th>
              <th>Depart</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(trajetsManage || []).map((t) => (
              <tr key={t.id}>
                <td>{asciiDisplay(t.ligne_code)}</td>
                <td className="tdMuted">{t.date_heure_depart ? String(t.date_heure_depart).slice(0, 16) : "—"}</td>
                <td>{t.statut}</td>
                <td>
                  <button type="button" className="linkishBtn" onClick={() => startEdit(t)}>
                    Modifier
                  </button>{" "}
                  <button type="button" className="linkishBtn linkishBtn--danger" onClick={() => onDelete(t.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChauffeurCrud({ chauffeurs, vehicules, onSaved, onError, onClearFlash, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    numero_permis: "",
    categorie_permis: "D",
    disponibilite: true,
    vehicule_id: "",
    date_embauche: "",
  });

  function startEdit(c) {
    setEditing(c.id);
    setForm({
      nom: c.nom || "",
      prenom: c.prenom || "",
      telephone: c.telephone || "",
      numero_permis: c.numero_permis || "",
      categorie_permis: c.categorie_permis || "D",
      disponibilite: !!(c.disponibilite === true || c.disponibilite === 1),
      vehicule_id: c.vehicule_id != null ? String(c.vehicule_id) : "",
      date_embauche: c.date_embauche ? String(c.date_embauche).slice(0, 10) : "",
    });
    onClearFlash();
  }

  async function submit(e) {
    e.preventDefault();
    onClearFlash();
    const body = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim() || null,
      categorie_permis: form.categorie_permis,
      disponibilite: form.disponibilite,
      vehicule_id: form.vehicule_id ? Number(form.vehicule_id) : null,
      date_embauche: form.date_embauche || null,
    };
    const permis = form.numero_permis.trim();
    if (!editing) {
      body.numero_permis = permis;
    } else if (permis) {
      body.numero_permis = permis;
    }
    try {
      if (editing) {
        await updateChauffeur(editing, body);
      } else {
        await createChauffeur(body);
      }
      setEditing(null);
      setForm({
        nom: "",
        prenom: "",
        telephone: "",
        numero_permis: "",
        categorie_permis: "D",
        disponibilite: true,
        vehicule_id: "",
        date_embauche: "",
      });
      await onSaved();
    } catch (err) {
      onError(err.message || "Erreur");
    }
  }

  return (
    <div className="crudSection">
      <form className="crudForm" onSubmit={submit}>
        <div className="crudFormGrid">
          <label>
            Nom
            <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
          </label>
          <label>
            Prenom
            <input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} required />
          </label>
          <label>
            Telephone
            <input value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </label>
          <label>
            N° permis
            <input
              value={form.numero_permis}
              onChange={(e) => setForm((f) => ({ ...f, numero_permis: e.target.value }))}
              required={!editing}
              placeholder={editing ? "Laisser vide pour ne pas modifier (non affiché par sécurité)" : ""}
            />
          </label>
          <label>
            Categorie
            <select value={form.categorie_permis} onChange={(e) => setForm((f) => ({ ...f, categorie_permis: e.target.value }))}>
              <option value="D">D</option>
              <option value="B">B</option>
            </select>
          </label>
          <label className="crudCheck">
            <input
              type="checkbox"
              checked={form.disponibilite}
              onChange={(e) => setForm((f) => ({ ...f, disponibilite: e.target.checked }))}
            />
            Disponible
          </label>
          <label>
            Vehicule
            <select value={form.vehicule_id} onChange={(e) => setForm((f) => ({ ...f, vehicule_id: e.target.value }))}>
              <option value="">—</option>
              {(vehicules || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {asciiDisplay(v.immatriculation)} ({v.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            Embauche
            <input type="date" value={form.date_embauche} onChange={(e) => setForm((f) => ({ ...f, date_embauche: e.target.value }))} />
          </label>
        </div>
        <div className="crudFormActions">
          <button type="submit" className="btnPrimary">
            {editing ? "Mettre a jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setEditing(null);
                setForm({
                  nom: "",
                  prenom: "",
                  telephone: "",
                  numero_permis: "",
                  categorie_permis: "D",
                  disponibilite: true,
                  vehicule_id: "",
                  date_embauche: "",
                });
              }}
            >
              Annuler edition
            </button>
          ) : null}
        </div>
      </form>
      <div className="crudTableWrap">
        <table className="crudTable">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Cat.</th>
              <th>Veh.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(chauffeurs || []).map((c) => (
              <tr key={c.id}>
                <td>
                  {asciiDisplay(c.prenom)} {asciiDisplay(c.nom)}
                </td>
                <td>{asciiDisplay(c.categorie_permis)}</td>
                <td>{c.immatriculation ? asciiDisplay(c.immatriculation) : "—"}</td>
                <td>
                  <button type="button" className="linkishBtn" onClick={() => startEdit(c)}>
                    Modifier
                  </button>{" "}
                  <button type="button" className="linkishBtn linkishBtn--danger" onClick={() => onDelete(c.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VehiculeCrud({ vehicules, onSaved, onError, onClearFlash, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    immatriculation: "",
    type: "bus",
    capacite: 25,
    statut: "actif",
    kilometrage: 0,
    date_acquisition: "",
  });

  function startEdit(v) {
    setEditing(v.id);
    onClearFlash?.();
    setForm({
      immatriculation: v.immatriculation || "",
      type: v.type || "bus",
      capacite: v.capacite ?? 25,
      statut: v.statut || "actif",
      kilometrage: v.kilometrage ?? 0,
      date_acquisition: v.date_acquisition ? String(v.date_acquisition).slice(0, 10) : "",
    });
  }

  async function submit(e) {
    e.preventDefault();
    onClearFlash?.();
    const body = {
      immatriculation: form.immatriculation.trim(),
      type: form.type,
      capacite: Number(form.capacite),
      statut: form.statut,
      kilometrage: Number(form.kilometrage) || 0,
      date_acquisition: form.date_acquisition || null,
    };
    try {
      if (editing) {
        await updateVehicule(editing, body);
      } else {
        await createVehicule(body);
      }
      setEditing(null);
      setForm({ immatriculation: "", type: "bus", capacite: 25, statut: "actif", kilometrage: 0, date_acquisition: "" });
      await onSaved();
    } catch (err) {
      onError(err.message || "Erreur");
    }
  }

  return (
    <div className="crudSection">
      <form className="crudForm" onSubmit={submit}>
        <div className="crudFormGrid">
          <label>
            Immatriculation
            <input value={form.immatriculation} onChange={(e) => setForm((f) => ({ ...f, immatriculation: e.target.value }))} required />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="bus">bus</option>
              <option value="minibus">minibus</option>
              <option value="taxi">taxi</option>
            </select>
          </label>
          <label>
            Places
            <input type="number" min={1} value={form.capacite} onChange={(e) => setForm((f) => ({ ...f, capacite: e.target.value }))} required />
          </label>
          <label>
            Statut
            <select value={form.statut} onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}>
              <option value="actif">actif</option>
              <option value="maintenance">maintenance</option>
              <option value="hors_service">hors_service</option>
            </select>
          </label>
          <label>
            km
            <input type="number" min={0} value={form.kilometrage} onChange={(e) => setForm((f) => ({ ...f, kilometrage: e.target.value }))} />
          </label>
          <label>
            Mise en service
            <input type="date" value={form.date_acquisition} onChange={(e) => setForm((f) => ({ ...f, date_acquisition: e.target.value }))} />
          </label>
        </div>
        <div className="crudFormActions">
          <button type="submit" className="btnPrimary">
            {editing ? "Mettre a jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setEditing(null);
                setForm({ immatriculation: "", type: "bus", capacite: 25, statut: "actif", kilometrage: 0, date_acquisition: "" });
              }}
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>
      <div className="crudTableWrap">
        <table className="crudTable">
          <thead>
            <tr>
              <th>Immat.</th>
              <th>Type</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(vehicules || []).map((v) => (
              <tr key={v.id}>
                <td>{asciiDisplay(v.immatriculation)}</td>
                <td>{v.type}</td>
                <td>{v.statut}</td>
                <td>
                  <button type="button" className="linkishBtn" onClick={() => startEdit(v)}>
                    Modifier
                  </button>{" "}
                  <button type="button" className="linkishBtn linkishBtn--danger" onClick={() => onDelete(v.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IncidentCrud({ incidents, trajetsList, onSaved, onError, onClearFlash, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    trajet_id: "",
    type: "retard",
    description: "",
    gravite: "faible",
    date_incident: "",
    resolu: false,
  });
  const selectedTrajet = (trajetsList || []).find((t) => String(t.id) === String(form.trajet_id));

  function startEdit(i) {
    setEditing(i.id);
    onClearFlash?.();
    const d = i.date_incident ? String(i.date_incident).replace(" ", "T").slice(0, 16) : "";
    setForm({
      trajet_id: String(i.trajet_id),
      type: i.type || "retard",
      description: i.description || "",
      gravite: i.gravite || "faible",
      date_incident: d,
      resolu: !!(i.resolu === true || i.resolu === 1),
    });
  }

  async function submit(e) {
    e.preventDefault();
    onClearFlash?.();
    if (!form.trajet_id) {
      onError("Choisissez un trajet.");
      return;
    }
    const raw = form.date_incident.replace("T", " ");
    const date_incident = raw.length === 16 ? `${raw}:00` : raw.includes(":") && raw.split(":").length === 2 ? `${raw}:00` : raw;
    const body = {
      trajet_id: Number(form.trajet_id),
      type: form.type,
      description: form.description || null,
      gravite: form.gravite,
      date_incident,
      resolu: form.resolu,
    };
    try {
      if (editing) {
        await updateIncident(editing, {
          trajet_id: body.trajet_id,
          type: body.type,
          description: body.description,
          gravite: body.gravite,
          date_incident: body.date_incident,
          resolu: body.resolu,
        });
      } else {
        await createIncident(body);
      }
      setEditing(null);
      setForm({ trajet_id: "", type: "retard", description: "", gravite: "faible", date_incident: "", resolu: false });
      await onSaved();
    } catch (err) {
      onError(err.message || "Erreur");
    }
  }

  return (
    <div className="crudSection">
      <form className="crudForm" onSubmit={submit}>
        <div className="crudFormGrid">
          <label>
            Trajet
            <select value={form.trajet_id} onChange={(e) => setForm((f) => ({ ...f, trajet_id: e.target.value }))} required>
              <option value="">—</option>
              {(trajetsList || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {asciiDisplay(t.ligne_code)} — {t.immatriculation || "—"} — {t.date_heure_depart ? String(t.date_heure_depart).replace("T", " ").slice(0, 16) : ""} ({t.statut})
                </option>
              ))}
            </select>
          </label>
          <label>
            Véhicule concerné
            <input
              type="text"
              value={selectedTrajet?.immatriculation || ""}
              placeholder="Sélectionnez un trajet"
              readOnly
            />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="panne">panne</option>
              <option value="accident">accident</option>
              <option value="retard">retard</option>
              <option value="autre">autre</option>
            </select>
          </label>
          <label>
            Gravite
            <select value={form.gravite} onChange={(e) => setForm((f) => ({ ...f, gravite: e.target.value }))}>
              <option value="faible">faible</option>
              <option value="moyen">moyen</option>
              <option value="grave">grave</option>
            </select>
          </label>
          <label className="crudFormGrid--full">
            Description
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </label>
          <label>
            Date / heure
            <input
              type="datetime-local"
              value={form.date_incident}
              onChange={(e) => setForm((f) => ({ ...f, date_incident: e.target.value }))}
              required
            />
          </label>
          <label className="crudCheck">
            <input type="checkbox" checked={form.resolu} onChange={(e) => setForm((f) => ({ ...f, resolu: e.target.checked }))} />
            Resolu
          </label>
        </div>
        <div className="crudFormActions">
          <button type="submit" className="btnPrimary">
            {editing ? "Mettre a jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setEditing(null);
                setForm({ trajet_id: "", type: "retard", description: "", gravite: "faible", date_incident: "", resolu: false });
              }}
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>
      <div className="crudTableWrap">
        <table className="crudTable">
          <thead>
            <tr>
              <th>Type</th>
              <th>Gravite</th>
              <th>Ligne / trajet</th>
              <th>Véhicule</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(incidents || []).slice(0, 80).map((i) => (
              <tr key={i.id}>
                <td>{i.type}</td>
                <td>{i.gravite}</td>
                <td className="tdMuted">
                  {[i.ligne_code, i.ligne_nom].filter(Boolean).map((x) => asciiDisplay(String(x))).join(" — ") || "—"}
                </td>
                <td>{asciiDisplay(i.immatriculation || "—")}</td>
                <td>
                  <button type="button" className="linkishBtn" onClick={() => startEdit(i)}>
                    Modifier
                  </button>{" "}
                  <button type="button" className="linkishBtn linkishBtn--danger" onClick={() => onDelete(i.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
