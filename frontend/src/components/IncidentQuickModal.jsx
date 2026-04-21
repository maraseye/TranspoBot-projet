import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { createIncident, fetchTrajetDetail } from "../api.js";

function defaultDateTimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function IncidentQuickModal({ trajetId, onClose, onSuccess }) {
  const [type, setType] = useState("retard");
  const [gravite, setGravite] = useState("moyen");
  const [description, setDescription] = useState("");
  const [dateIncident, setDateIncident] = useState(defaultDateTimeLocal);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [vehiculeLabel, setVehiculeLabel] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadTrajetVehicule() {
      if (!trajetId) {
        setVehiculeLabel("");
        return;
      }
      try {
        const d = await fetchTrajetDetail(trajetId);
        if (cancelled) return;
        setVehiculeLabel((d?.trajet?.immatriculation || "").trim());
      } catch {
        if (!cancelled) setVehiculeLabel("");
      }
    }
    loadTrajetVehicule();
    return () => {
      cancelled = true;
    };
  }, [trajetId]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const raw = dateIncident.replace("T", " ");
    const date_incident = raw.length === 16 ? `${raw}:00` : raw;
    setSaving(true);
    try {
      await createIncident({
        trajet_id: trajetId,
        type,
        description: description.trim() || null,
        gravite,
        date_incident,
        resolu: false,
      });
      await onSuccess?.(trajetId);
      onClose?.();
    } catch (e2) {
      setErr(e2.message || "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Declarer un incident"
      subtitle="Le trajet reste en cours tant qu'il n'est pas marque termine."
      onClose={onClose}
    >
      <form className="incidentQuickForm" onSubmit={submit}>
        {err ? <div className="modalError" style={{ marginBottom: 12 }}>{err}</div> : null}
        <div className="muted" style={{ marginBottom: 12 }}>
          Véhicule concerné : {vehiculeLabel || "—"}
        </div>
        <div className="crudFormGrid">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="panne">panne</option>
              <option value="accident">accident</option>
              <option value="retard">retard</option>
              <option value="autre">autre</option>
            </select>
          </label>
          <label>
            Gravite
            <select value={gravite} onChange={(e) => setGravite(e.target.value)}>
              <option value="faible">faible</option>
              <option value="moyen">moyen</option>
              <option value="grave">grave</option>
            </select>
          </label>
          <label className="crudFormGrid--full">
            Date et heure
            <input type="datetime-local" value={dateIncident} onChange={(e) => setDateIncident(e.target.value)} required />
          </label>
          <label className="crudFormGrid--full">
            Description (optionnel)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
        </div>
        <div className="crudFormActions">
          <button type="submit" className="btnPrimary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer l'incident"}
          </button>
          <button type="button" className="btnGhost" onClick={onClose} disabled={saving}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}
