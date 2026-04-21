import { useState, useCallback } from "react";
import Modal from "./Modal.jsx";
import { IconDownload, IconReport } from "./Icons.jsx";
import { fetchRapportJournalier, fetchRapportMensuel } from "../api.js";

/* ── Utilitaires ─────────────────────────────────────────── */
function fmt(n) {
  return Number(n || 0).toLocaleString("fr-FR");
}
function cur(n) {
  return `${fmt(n)} FCFA`;
}
function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(String(s).replace(" ", "T"));
  return isNaN(d) ? s : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDateShort(s) {
  if (!s) return "—";
  const d = new Date(String(s).replace(" ", "T"));
  return isNaN(d) ? s : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Génération HTML du rapport ──────────────────────────── */
function buildReportHtml(data) {
  const isDaily = data.type === "journalier";
  const titre = isDaily
    ? `Rapport Journalier — ${data.date_label}`
    : `Rapport Mensuel — ${data.periode_label}`;

  const stats = data.stats || {};

  /* Badges statut */
  const statutBadge = (s) => {
    const map = { termine: "#22c55e", en_cours: "#3b82f6", annule: "#ef4444", planifie: "#f59e0b" };
    const color = map[s] || "#6b7280";
    const labels = { termine: "Terminé", en_cours: "En cours", annule: "Annulé", planifie: "Planifié" };
    return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.3px">${labels[s] || s}</span>`;
  };

  /* Carte stat */
  const statCard = (label, value, color = "#6366f1") => `
    <div style="flex:1;min-width:120px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;text-align:center">
      <div style="font-size:22px;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:500">${label}</div>
    </div>`;

  /* Tableau trajets */
  const trajetRows = (data.trajets || []).map((t, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">#${t.id}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${t.ligne_code || ""} — ${t.ligne || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${t.chauffeur_prenom || ""} ${t.chauffeur_nom || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${t.immatriculation || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${fmtDateShort(t.date_heure_depart)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:center">${statutBadge(t.statut)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right">${fmt(t.nb_passagers)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600;color:#6366f1">${cur(t.recette)}</td>
    </tr>`).join("");

  /* Tableau incidents */
  const graviteColor = { grave: "#ef4444", moyen: "#f59e0b", faible: "#22c55e" };
  const incidentRows = (data.incidents || []).map((inc, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${inc.ligne_code || ""} ${inc.ligne || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${inc.type || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">
        <span style="color:${graviteColor[inc.gravite] || "#6b7280"};font-weight:700">${inc.gravite || ""}</span>
      </td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${inc.chauffeur_prenom || ""} ${inc.chauffeur_nom || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${inc.resolu ? "✔ Résolu" : "⏳ Ouvert"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">${(inc.description || "").substring(0, 60)}</td>
    </tr>`).join("");

  /* Section top chauffeurs (mensuel uniquement) */
  const topChauffeurs = isDaily ? "" : `
    <h3 style="margin:24px 0 10px;font-size:14px;color:#1e293b;font-weight:700;border-left:3px solid #6366f1;padding-left:10px">
      🏆 Top 10 Chauffeurs
    </h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#6366f1;color:#fff">
          <th style="padding:8px 10px;text-align:left;font-weight:600">Rang</th>
          <th style="padding:8px 10px;text-align:left;font-weight:600">Chauffeur</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600">Trajets</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600">Passagers</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600">Recette</th>
        </tr>
      </thead>
      <tbody>
        ${(data.top_chauffeurs || []).map((c, i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#6366f1">${i + 1}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9">${c.chauffeur_prenom || ""} ${c.chauffeur_nom || ""}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(c.nb_trajets)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(c.nb_passagers)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#6366f1">${cur(c.recette)}</td>
          </tr>`).join("")}
      </tbody>
    </table>

    <h3 style="margin:24px 0 10px;font-size:14px;color:#1e293b;font-weight:700;border-left:3px solid #6366f1;padding-left:10px">
      🛣️ Top Lignes
    </h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#6366f1;color:#fff">
          <th style="padding:8px 10px;text-align:left;font-weight:600">Ligne</th>
          <th style="padding:8px 10px;text-align:left;font-weight:600">Trajet</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600">Trajets</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600">Passagers</th>
          <th style="padding:8px 10px;text-align:right;font-weight:600">Recette</th>
        </tr>
      </thead>
      <tbody>
        ${(data.top_lignes || []).map((l, i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:700">${l.ligne_code || ""}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9">${l.origine || ""} → ${l.destination || ""}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(l.nb_trajets)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(l.nb_passagers)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#6366f1">${cur(l.recette)}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${titre}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 13px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body style="padding:32px 40px;max-width:960px;margin:0 auto">

  <!-- En-tête -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #6366f1;padding-bottom:18px;margin-bottom:24px">
    <div>
      <div style="font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.5px">🚌 TranspoBot</div>
      <div style="font-size:13px;color:#64748b;margin-top:2px">Système de gestion de transport</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:700;color:#6366f1">${titre}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">Généré le ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
    </div>
  </div>

  <!-- Résumé statistiques -->
  <h3 style="margin-bottom:12px;font-size:14px;color:#1e293b;font-weight:700;border-left:3px solid #6366f1;padding-left:10px">
    📊 Résumé
  </h3>
  <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px">
    ${statCard("Total trajets", fmt(stats.nb_trajets), "#6366f1")}
    ${statCard("Terminés", fmt(stats.nb_termines), "#22c55e")}
    ${statCard("En cours", fmt(stats.nb_en_cours), "#3b82f6")}
    ${statCard("Annulés", fmt(stats.nb_annules), "#ef4444")}
    ${statCard("Passagers", fmt(stats.nb_passagers), "#f59e0b")}
    ${statCard("Recette totale", cur(stats.recette_totale), "#6366f1")}
  </div>

  ${topChauffeurs}

  <!-- Détail des trajets -->
  <h3 style="margin:24px 0 10px;font-size:14px;color:#1e293b;font-weight:700;border-left:3px solid #6366f1;padding-left:10px">
    🚌 Détail des Trajets (${(data.trajets || []).length})
  </h3>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="background:#6366f1;color:#fff">
        <th style="padding:8px 10px;text-align:left;font-weight:600">ID</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Ligne</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Chauffeur</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Véhicule</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Date</th>
        <th style="padding:8px 10px;text-align:center;font-weight:600">Statut</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600">Passagers</th>
        <th style="padding:8px 10px;text-align:right;font-weight:600">Recette</th>
      </tr>
    </thead>
    <tbody>
      ${trajetRows || `<tr><td colspan="8" style="text-align:center;padding:20px;color:#94a3b8">Aucun trajet pour cette période</td></tr>`}
    </tbody>
  </table>

  <!-- Incidents -->
  ${(data.incidents || []).length > 0 ? `
  <h3 style="margin:24px 0 10px;font-size:14px;color:#1e293b;font-weight:700;border-left:3px solid #ef4444;padding-left:10px">
    ⚠️ Incidents (${data.incidents.length})
  </h3>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="background:#ef4444;color:#fff">
        <th style="padding:8px 10px;text-align:left;font-weight:600">Ligne</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Type</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Gravité</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Chauffeur</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Statut</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600">Description</th>
      </tr>
    </thead>
    <tbody>${incidentRows}</tbody>
  </table>` : ""}

  <!-- Pied de page -->
  <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:11px">
    <span>TranspoBot — Rapport confidentiel</span>
    <span>Document généré automatiquement</span>
  </div>

</body>
</html>`;
}

/* ── Déclenchement de l'impression ──────────────────────── */
function downloadAsPdf(data) {
  const html = buildReportHtml(data);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 400);
}

/* ── Composant principal ─────────────────────────────────── */
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function ReportModal({ onClose }) {
  const today = new Date();
  const [tab, setTab] = useState("journalier"); // 'journalier' | 'mensuel'

  /* Journalier */
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));

  /* Mensuel */
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  /* État commun */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null); // données du rapport chargé

  /* ── Chargement des données ── */
  const loadReport = useCallback(async () => {
    setError(null);
    setLoading(true);
    setPreview(null);
    try {
      let data;
      if (tab === "journalier") {
        data = await fetchRapportJournalier(selectedDate);
      } else {
        data = await fetchRapportMensuel(selectedYear, selectedMonth);
      }
      setPreview(data);
    } catch (e) {
      setError(e.message || "Impossible de charger le rapport.");
    } finally {
      setLoading(false);
    }
  }, [tab, selectedDate, selectedYear, selectedMonth]);

  /* ── Téléchargement direct ── */
  const handleDownload = useCallback(async () => {
    if (preview) {
      downloadAsPdf(preview);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let data;
      if (tab === "journalier") {
        data = await fetchRapportJournalier(selectedDate);
      } else {
        data = await fetchRapportMensuel(selectedYear, selectedMonth);
      }
      setPreview(data);
      downloadAsPdf(data);
    } catch (e) {
      setError(e.message || "Impossible de générer le rapport.");
    } finally {
      setLoading(false);
    }
  }, [preview, tab, selectedDate, selectedYear, selectedMonth]);

  /* ── Années disponibles ── */
  const years = [];
  for (let y = today.getFullYear(); y >= today.getFullYear() - 5; y--) years.push(y);

  /* ── Résumé du preview ── */
  const stats = preview?.stats || {};

  return (
    <Modal
      title="Rapports"
      subtitle="Téléchargez vos rapports journaliers ou mensuels en PDF"
      onClose={onClose}
      wide
    >
      {/* Onglets */}
      <div className="reportTabs">
        <button
          type="button"
          className={`reportTab ${tab === "journalier" ? "reportTab--active" : ""}`}
          onClick={() => { setTab("journalier"); setPreview(null); setError(null); }}
          id="report-tab-journalier"
        >
          📅 Rapport Journalier
        </button>
        <button
          type="button"
          className={`reportTab ${tab === "mensuel" ? "reportTab--active" : ""}`}
          onClick={() => { setTab("mensuel"); setPreview(null); setError(null); }}
          id="report-tab-mensuel"
        >
          📆 Rapport Mensuel
        </button>
      </div>

      {/* Sélecteurs */}
      <div className="reportControls">
        {tab === "journalier" ? (
          <div className="reportField">
            <label htmlFor="report-date" className="reportLabel">Date</label>
            <input
              id="report-date"
              type="date"
              className="reportInput"
              value={selectedDate}
              max={today.toISOString().slice(0, 10)}
              onChange={(e) => { setSelectedDate(e.target.value); setPreview(null); }}
            />
          </div>
        ) : (
          <div className="reportFieldRow">
            <div className="reportField">
              <label htmlFor="report-month" className="reportLabel">Mois</label>
              <select
                id="report-month"
                className="reportInput reportInput--select"
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPreview(null); }}
              >
                {MONTHS_FR.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="reportField">
              <label htmlFor="report-year" className="reportLabel">Année</label>
              <select
                id="report-year"
                className="reportInput reportInput--select"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setPreview(null); }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="reportActions">
          <button
            type="button"
            className="reportBtn reportBtn--secondary"
            onClick={loadReport}
            disabled={loading}
            id="report-btn-preview"
          >
            <IconReport size={16} />
            {loading ? "Chargement…" : "Aperçu"}
          </button>
          <button
            type="button"
            className="reportBtn reportBtn--primary"
            onClick={handleDownload}
            disabled={loading}
            id="report-btn-download"
          >
            <IconDownload size={16} />
            {loading ? "Génération…" : "Télécharger PDF"}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="reportError" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Aperçu des données */}
      {preview && !error && (
        <div className="reportPreview">
          <div className="reportPreviewTitle">
            {preview.type === "journalier"
              ? `📅 Rapport du ${preview.date_label}`
              : `📆 Rapport — ${preview.periode_label}`}
          </div>

          {/* Cartes stats */}
          <div className="reportStatGrid">
            <div className="reportStatCard">
              <span className="reportStatValue reportStatValue--primary">{fmt(stats.nb_trajets)}</span>
              <span className="reportStatLabel">Trajets total</span>
            </div>
            <div className="reportStatCard">
              <span className="reportStatValue reportStatValue--green">{fmt(stats.nb_termines)}</span>
              <span className="reportStatLabel">Terminés</span>
            </div>
            <div className="reportStatCard">
              <span className="reportStatValue reportStatValue--blue">{fmt(stats.nb_en_cours)}</span>
              <span className="reportStatLabel">En cours</span>
            </div>
            <div className="reportStatCard">
              <span className="reportStatValue reportStatValue--red">{fmt(stats.nb_annules)}</span>
              <span className="reportStatLabel">Annulés</span>
            </div>
            <div className="reportStatCard">
              <span className="reportStatValue reportStatValue--amber">{fmt(stats.nb_passagers)}</span>
              <span className="reportStatLabel">Passagers</span>
            </div>
            <div className="reportStatCard reportStatCard--wide">
              <span className="reportStatValue reportStatValue--primary">{cur(stats.recette_totale)}</span>
              <span className="reportStatLabel">Recette totale</span>
            </div>
          </div>

          {/* Résumé tableau condensé */}
          {(preview.trajets || []).length > 0 && (
            <div className="reportTableWrap">
              <div className="reportTableTitle">Aperçu des trajets ({(preview.trajets || []).length})</div>
              <table className="reportTable">
                <thead>
                  <tr>
                    <th>Ligne</th>
                    <th>Chauffeur</th>
                    <th>Date départ</th>
                    <th>Statut</th>
                    <th className="right">Recette</th>
                  </tr>
                </thead>
                <tbody>
                  {(preview.trajets || []).slice(0, 8).map((t) => (
                    <tr key={t.id}>
                      <td><span className="reportBadge">{t.ligne_code}</span> {t.ligne}</td>
                      <td>{t.chauffeur_prenom} {t.chauffeur_nom}</td>
                      <td>{fmtDateShort(t.date_heure_depart)}</td>
                      <td>
                        <span className={`reportStatutBadge reportStatutBadge--${t.statut}`}>
                          {t.statut === "termine" ? "Terminé" : t.statut === "en_cours" ? "En cours" : t.statut === "annule" ? "Annulé" : "Planifié"}
                        </span>
                      </td>
                      <td className="right reportRecette">{cur(t.recette)}</td>
                    </tr>
                  ))}
                  {(preview.trajets || []).length > 8 && (
                    <tr>
                      <td colSpan={5} className="reportTableMore">
                        + {(preview.trajets || []).length - 8} trajets supplémentaires dans le PDF
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="reportDownloadHint">
            <IconDownload size={14} />
            Cliquez sur <strong>Télécharger PDF</strong> pour obtenir le rapport complet
          </div>
        </div>
      )}

      {/* État vide */}
      {!preview && !error && !loading && (
        <div className="reportEmpty">
          <IconReport size={40} className="reportEmptyIcon" />
          <p>Sélectionnez une période et cliquez sur <strong>Aperçu</strong> ou <strong>Télécharger PDF</strong></p>
        </div>
      )}
    </Modal>
  );
}
