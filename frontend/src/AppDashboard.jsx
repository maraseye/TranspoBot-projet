/**
 * AppDashboard — Dashboard principal TranspoBot
 * Séparé de App.jsx pour respecter les règles React (hooks non conditionnels).
 * Reçoit currentUser et onLogout comme props depuis App.jsx.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import ChatPanel from "./components/ChatPanel.jsx";
import StatsCards from "./components/StatsCards.jsx";
import TrajetsRecent from "./components/TrajetsRecent.jsx";
import DashboardEntityTiles from "./components/DashboardEntityTiles.jsx";
import DashboardCrudPanel from "./components/DashboardCrudPanel.jsx";
import EntityListModal from "./components/EntityListModal.jsx";
import StatDetailModal from "./components/StatDetailModal.jsx";
import IncidentQuickModal from "./components/IncidentQuickModal.jsx";
import TrajetDetailModal from "./components/TrajetDetailModal.jsx";
import ChauffeurDetailModal from "./components/ChauffeurDetailModal.jsx";
import LigneDetailModal from "./components/LigneDetailModal.jsx";
import VehiculeDetailModal from "./components/VehiculeDetailModal.jsx";
import ReportModal from "./components/ReportModal.jsx";
import UserManagementPanel from "./components/UserManagementPanel.jsx";
import {
  IconBus,
  IconChat,
  IconClose,
  IconDashboard,
  IconClock,
  IconBot,
  IconCalendar,
  IconTrophy,
  IconWrench,
  IconIncident,
  IconRevenue,
  IconSun,
  IconMoon,
  IconExpand,
  IconContract,
  IconReport,
} from "./components/Icons.jsx";
import {
  fetchChatAnswer,
  fetchStats,
  fetchTrajetsRecent,
  fetchStatDetail,
  fetchTrajetDetail,
  fetchChauffeurs,
  fetchChauffeurDetail,
  fetchLignes,
  fetchLigneDetail,
  fetchVehicules,
  fetchVehiculeDetail,
  updateChauffeur,
  updateTrajet,
  updateVehicule,
  updateIncident,
} from "./api.js";
import { asciiDisplay } from "./utils/displayText.js";
import { loadArchive, saveClosedConversation } from "./utils/chatArchive.js";

const THEME_STORAGE_KEY = "transpobot_theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

function defaultWelcomeMessage() {
  return {
    id: nextId(),
    role: "bot",
    text: "Bonjour ! Je suis TranspoBot, votre assistant intelligent.\nPosez-moi une question sur votre flotte, vos trajets ou vos chauffeurs.",
  };
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildChatHistoryForApi(msgs) {
  if (!Array.isArray(msgs) || msgs.length === 0) return [];
  const out = [];
  for (const m of msgs) {
    if (m.role !== "user" && m.role !== "bot") continue;
    const text = (m.text || "").trim();
    if (!text) continue;
    if (/analyse en cours/i.test(text)) continue;
    out.push({ role: m.role === "bot" ? "assistant" : "user", text });
  }
  return out.slice(-12);
}

function nowForTrajetArriveeMysql() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function AppDashboard({ currentUser, onLogout }) {
  const isAdmin = currentUser.role === "admin";

  // ── Suggestions ───────────────────────────────────────────────
  const suggestionMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const suggestions = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const periodLabel = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return [
      { label: "Trajets cette semaine", Icon: IconCalendar, question: "Combien de trajets ont été effectués cette semaine ?" },
      { label: "Meilleur chauffeur", Icon: IconTrophy, question: "Quel chauffeur a le plus de trajets ?" },
      { label: "Véhicules en maintenance", Icon: IconWrench, question: "Quels véhicules sont en maintenance ?" },
      { label: "Incidents graves", Icon: IconIncident, question: "Liste les incidents graves non résolus" },
      {
        label: "Recette ce mois-ci",
        Icon: IconRevenue,
        question: `Quelle est la recette totale des trajets termines pour le mois calendaire en cours (${periodLabel}) ? Somme la recette des trajets avec statut termine dont la date de depart appartient a ce mois (annee ${y}, mois ${m}).`,
      },
    ];
  }, [suggestionMonthKey]);

  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [trajets, setTrajets] = useState(null);
  const [vehicules, setVehicules] = useState(null);
  const [chauffeurs, setChauffeurs] = useState(null);
  const [lignes, setLignes] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(() =>
    typeof window !== "undefined" ? !window.matchMedia("(max-width: 900px)").matches : true,
  );
  const [chatFullPage, setChatFullPage] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [messages, setMessages] = useState(() => [defaultWelcomeMessage()]);
  const [theme, setTheme] = useState(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const [statModalOpen, setStatModalOpen] = useState(false);
  const [statDetail, setStatDetail] = useState(null);
  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState(null);
  const [statLoadingTitle, setStatLoadingTitle] = useState("");

  const [trajetModalOpen, setTrajetModalOpen] = useState(false);
  const [trajetData, setTrajetData] = useState(null);
  const [trajetLoading, setTrajetLoading] = useState(false);
  const [trajetError, setTrajetError] = useState(null);

  const [chauffeurModalOpen, setChauffeurModalOpen] = useState(false);
  const [chauffeurData, setChauffeurData] = useState(null);
  const [chauffeurLoading, setChauffeurLoading] = useState(false);
  const [chauffeurError, setChauffeurError] = useState(null);

  const [ligneModalOpen, setLigneModalOpen] = useState(false);
  const [ligneData, setLigneData] = useState(null);
  const [ligneLoading, setLigneLoading] = useState(false);
  const [ligneError, setLigneError] = useState(null);

  const [vehiculeModalOpen, setVehiculeModalOpen] = useState(false);
  const [vehiculeData, setVehiculeData] = useState(null);
  const [vehiculeLoading, setVehiculeLoading] = useState(false);
  const [vehiculeError, setVehiculeError] = useState(null);

  const [entityListKind, setEntityListKind] = useState(null);
  const [quickIncidentTrajetId, setQuickIncidentTrajetId] = useState(null);

  const startNewChat = useCallback(() => {
    const hasUser = messages.some((m) => m.role === "user");
    if (hasUser) {
      saveClosedConversation(messages, activeConversationId);
      setArchivedConversations(loadArchive().conversations);
    }
    setMessages([defaultWelcomeMessage()]);
    setActiveConversationId(null);
  }, [messages, activeConversationId]);

  const resumeConversation = useCallback((conv) => {
    if (!conv?.messages?.length) return;
    setMessages(conv.messages.map((m) => ({ ...m })));
    setActiveConversationId(conv.id);
  }, []);

  const closeChat = useCallback(() => {
    const hasUser = messages.some((m) => m.role === "user");
    if (hasUser) {
      saveClosedConversation(messages, activeConversationId);
      setArchivedConversations(loadArchive().conversations);
    }
    setMessages([defaultWelcomeMessage()]);
    setActiveConversationId(null);
    setChatOpen(false);
    setChatFullPage(false);
  }, [messages, activeConversationId]);

  const openStatDetail = useCallback(async (key, label) => {
    setStatModalOpen(true);
    setStatDetail(null);
    setStatError(null);
    setStatLoading(true);
    setStatLoadingTitle(label);
    try {
      const d = await fetchStatDetail(key);
      setStatDetail(d);
    } catch (e) {
      setStatError(e.message || "Impossible de charger le détail.");
    } finally {
      setStatLoading(false);
    }
  }, []);

  const closeStatModal = useCallback(() => {
    setStatModalOpen(false);
    setStatDetail(null);
    setStatError(null);
  }, []);

  const reloadStatDetail = useCallback(async (key, opts = {}) => {
    setStatLoading(true);
    setStatError(null);
    try {
      const d = await fetchStatDetail(key, opts);
      setStatDetail(d);
      if (key === "recette_mois" || key === "recette_totale") {
        try {
          setStats(await fetchStats());
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setStatError(e.message || "Impossible de charger le détail.");
    } finally {
      setStatLoading(false);
    }
  }, []);

  const resolveIncident = useCallback(
    async (incidentId) => {
      try {
        await updateIncident(incidentId, { resolu: true });
      } catch (e) {
        window.alert(e.message || "Impossible de marquer l'incident comme résolu.");
        throw e;
      }
      try {
        setStats(await fetchStats());
      } catch {
        /* ignore */
      }
      if (statModalOpen && statDetail?.key === "incidents_ouverts") {
        try {
          setStatDetail(await fetchStatDetail("incidents_ouverts"));
        } catch {
          /* ignore */
        }
      }
      if (trajetModalOpen && trajetData?.trajet?.id != null) {
        try {
          setTrajetData(await fetchTrajetDetail(trajetData.trajet.id));
        } catch {
          /* ignore */
        }
      }
    },
    [statModalOpen, statDetail?.key, trajetModalOpen, trajetData?.trajet?.id],
  );

  const openTrajetDetail = useCallback(async (id, options = {}) => {
    if (options.closeChauffeur) {
      setChauffeurModalOpen(false);
      setChauffeurData(null);
      setChauffeurError(null);
    }
    if (options.closeVehicule) {
      setVehiculeModalOpen(false);
      setVehiculeData(null);
      setVehiculeError(null);
    }
    setTrajetModalOpen(true);
    setTrajetData(null);
    setTrajetError(null);
    setTrajetLoading(true);
    try {
      const d = await fetchTrajetDetail(id);
      setTrajetData(d);
    } catch (e) {
      setTrajetError(e.message || "Trajet introuvable.");
    } finally {
      setTrajetLoading(false);
    }
  }, []);

  const closeTrajetModal = useCallback(() => {
    setTrajetModalOpen(false);
    setTrajetData(null);
    setTrajetError(null);
  }, []);

  const openChauffeurDetail = useCallback(async (id) => {
    setChauffeurModalOpen(true);
    setChauffeurData(null);
    setChauffeurError(null);
    setChauffeurLoading(true);
    try {
      const d = await fetchChauffeurDetail(id);
      setChauffeurData(d);
    } catch (e) {
      setChauffeurError(e.message || "Chauffeur introuvable.");
    } finally {
      setChauffeurLoading(false);
    }
  }, []);

  const closeChauffeurModal = useCallback(() => {
    setChauffeurModalOpen(false);
    setChauffeurData(null);
    setChauffeurError(null);
  }, []);

  const openLigneDetail = useCallback(async (id) => {
    setLigneModalOpen(true);
    setLigneData(null);
    setLigneError(null);
    setLigneLoading(true);
    try {
      const d = await fetchLigneDetail(id);
      setLigneData(d);
    } catch (e) {
      setLigneError(e.message || "Ligne introuvable.");
    } finally {
      setLigneLoading(false);
    }
  }, []);

  const closeLigneModal = useCallback(() => {
    setLigneModalOpen(false);
    setLigneData(null);
    setLigneError(null);
  }, []);

  const openVehiculeDetail = useCallback(async (id) => {
    setVehiculeModalOpen(true);
    setVehiculeData(null);
    setVehiculeError(null);
    setVehiculeLoading(true);
    try {
      const d = await fetchVehiculeDetail(id);
      setVehiculeData(d);
    } catch (e) {
      setVehiculeError(e.message || "Véhicule introuvable.");
    } finally {
      setVehiculeLoading(false);
    }
  }, []);

  const closeVehiculeModal = useCallback(() => {
    setVehiculeModalOpen(false);
    setVehiculeData(null);
    setVehiculeError(null);
  }, []);

  const closeEntityListModal = useCallback(() => setEntityListKind(null), []);

  const openVehiculeFromList = useCallback(
    (id) => {
      setEntityListKind(null);
      openVehiculeDetail(id);
    },
    [openVehiculeDetail],
  );

  const openChauffeurFromList = useCallback(
    (id) => {
      setEntityListKind(null);
      openChauffeurDetail(id);
    },
    [openChauffeurDetail],
  );

  const openLigneFromList = useCallback(
    (id) => {
      setEntityListKind(null);
      openLigneDetail(id);
    },
    [openLigneDetail],
  );

  const loadInitial = useCallback(async () => {
    try {
      const [s, t, ve, ch, li] = await Promise.all([
        fetchStats(),
        fetchTrajetsRecent(),
        fetchVehicules(),
        fetchChauffeurs(),
        fetchLignes(),
      ]);
      setStats(s);
      setTrajets(t);
      setVehicules(ve);
      setChauffeurs(ch);
      setLignes(li);
    } catch {
      // API hors ligne
    }
  }, []);

  const refreshAfterIncident = useCallback(
    async (tid) => {
      await loadInitial();
      if (statModalOpen && statDetail?.key === "trajets_en_cours") {
        try {
          setStatDetail(await fetchStatDetail("trajets_en_cours"));
        } catch {
          /* ignore */
        }
      }
      if (trajetModalOpen && tid != null) {
        try {
          setTrajetData(await fetchTrajetDetail(tid));
        } catch {
          /* ignore */
        }
      }
    },
    [loadInitial, statModalOpen, statDetail?.key, trajetModalOpen],
  );

  const afterTrajetUpdated = useCallback(
    async (trajetId) => {
      await loadInitial();
      if (statModalOpen && statDetail?.key === "trajets_en_cours") {
        try {
          setStatDetail(await fetchStatDetail("trajets_en_cours"));
        } catch {
          /* ignore */
        }
      }
      if (statModalOpen && (statDetail?.key === "recette_mois" || statDetail?.key === "recette_totale")) {
        try {
          if (statDetail.key === "recette_mois" && statDetail.year != null && statDetail.month != null) {
            setStatDetail(await fetchStatDetail("recette_mois", { year: statDetail.year, month: statDetail.month }));
          } else {
            setStatDetail(await fetchStatDetail("recette_totale"));
          }
        } catch {
          /* ignore */
        }
      }
      if (trajetModalOpen) {
        try {
          setTrajetData(await fetchTrajetDetail(trajetId));
        } catch {
          /* ignore */
        }
      }
    },
    [loadInitial, statModalOpen, statDetail, trajetModalOpen],
  );

  const completeTrajetEnCours = useCallback(
    async (id) => {
      try {
        await updateTrajet(id, {
          statut: "termine",
          date_heure_arrivee: nowForTrajetArriveeMysql(),
        });
      } catch (e) {
        window.alert(e.message || "Impossible de terminer le trajet.");
        throw e;
      }
      await afterTrajetUpdated(id);
    },
    [afterTrajetUpdated],
  );

  const changeTrajetStatutFromStatModal = useCallback(
    async (id, statut) => {
      const s = String(statut || "").toLowerCase();
      const body = { statut: s };
      if (s === "termine") {
        body.date_heure_arrivee = nowForTrajetArriveeMysql();
      }
      try {
        await updateTrajet(id, body);
      } catch (e) {
        window.alert(e.message || "Impossible de mettre à jour le trajet.");
        throw e;
      }
      await afterTrajetUpdated(id);
    },
    [afterTrajetUpdated],
  );

  const changeVehiculeStatutFromStatModal = useCallback(
    async (vehiculeId, statut) => {
      const s = String(statut || "").toLowerCase();
      if (s !== "actif" && s !== "maintenance" && s !== "hors_service") return;
      try {
        await updateVehicule(vehiculeId, { statut: s });
      } catch (e) {
        window.alert(e.message || "Impossible de mettre à jour le véhicule.");
        throw e;
      }
      await loadInitial();
      try {
        setStats(await fetchStats());
      } catch {
        /* ignore */
      }
      if (statModalOpen && (statDetail?.key === "vehicules_maintenance" || statDetail?.key === "vehicules_actifs")) {
        try {
          setStatDetail(await fetchStatDetail(statDetail.key));
        } catch {
          /* ignore */
        }
      }
      if (vehiculeModalOpen && vehiculeData?.vehicule?.id === vehiculeId) {
        try {
          setVehiculeData(await fetchVehiculeDetail(vehiculeId));
        } catch {
          /* ignore */
        }
      }
    },
    [loadInitial, statModalOpen, statDetail?.key, vehiculeModalOpen, vehiculeData?.vehicule?.id],
  );

  const changeChauffeurDisponibiliteFromModal = useCallback(
    async (chauffeurId, disponibilite) => {
      try {
        await updateChauffeur(chauffeurId, { disponibilite: Boolean(disponibilite) });
      } catch (e) {
        window.alert(e.message || "Impossible de mettre à jour le chauffeur.");
        throw e;
      }
      await loadInitial();
      if (chauffeurModalOpen && chauffeurData?.chauffeur?.id === chauffeurId) {
        try {
          setChauffeurData(await fetchChauffeurDetail(chauffeurId));
        } catch {
          /* ignore */
        }
      }
    },
    [loadInitial, chauffeurModalOpen, chauffeurData?.chauffeur?.id],
  );

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    setArchivedConversations(loadArchive().conversations);
  }, []);

  useEffect(() => {
    if (!chatFullPage) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chatFullPage]);

  async function onSend(question) {
    const q = (question || "").trim();
    if (!q) return;

    const historyForApi = buildChatHistoryForApi(messages);
    const userMsg = { id: nextId(), role: "user", text: q };
    const pendingId = nextId();
    const botPending = { id: pendingId, role: "bot", text: "Analyse en cours..." };

    setMessages((prev) => [...prev, userMsg, botPending]);

    try {
      const data = await fetchChatAnswer(q, historyForApi);
      const answer = (data?.answer ?? "").trim();
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, text: asciiDisplay(answer) } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId ? { ...m, text: asciiDisplay("Erreur de connexion au serveur.") } : m,
        ),
      );
    }
  }

  return (
    <div className="appRoot" data-chat-fullpage={chatFullPage ? "true" : undefined}>
      <header className="topbar">
        <div className="topbarLeft">
          <div className="logoIcon" aria-hidden="true">
            <IconBus size={26} />
          </div>
          <div className="brandTitle">
            <h1>TranspoBot</h1>
          </div>
        </div>
        <div className="topbarRight">
          <button
            type="button"
            className="reportNavBtn"
            onClick={() => setReportModalOpen(true)}
            aria-label="Télécharger un rapport PDF"
            title="Rapports PDF"
            id="topbar-btn-rapports"
          >
            <IconReport size={18} />
            <span>Rapports</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className="topbarUserMgmtBtn"
              onClick={() => setUserMgmtOpen(true)}
              aria-label="Gérer les utilisateurs"
              title="Gestion des utilisateurs"
              id="topbar-btn-users"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Utilisateurs</span>
            </button>
          )}
          <button
            type="button"
            className="themeToggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>
          <div className="topbarUserInfo" title={`Connecté en tant que ${currentUser.username} (${currentUser.role})`}>
            <div className="topbarAvatar">
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
            <span className="topbarUsername">{currentUser.username}</span>
            {isAdmin && <span className="topbarRoleBadge">Admin</span>}
          </div>
          <button
            type="button"
            className="topbarLogoutBtn"
            onClick={onLogout}
            aria-label="Se déconnecter"
            title="Déconnexion"
            id="topbar-btn-logout"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Déconnexion</span>
          </button>
          <div className="liveIndicator">
            <span className="liveDot" />
            <span>En ligne</span>
          </div>
        </div>
      </header>

      <div className={`page ${chatOpen && !chatFullPage ? "page--chat-open" : "page--chat-closed"}`}>
        <div className="dashboardColumn">
          <section className="card card--elevated">
            <div className="cardHeader cardHeader--modern">
              <div className="cardHeaderIcon">
                <IconDashboard />
              </div>
              <div>
                <h2>Tableau de bord</h2>
                <div className="muted cardHeaderDate">
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <StatsCards stats={stats} onStatClick={openStatDetail} />

            <DashboardCrudPanel vehicules={vehicules} chauffeurs={chauffeurs} lignes={lignes} onReload={loadInitial} />

            <div className="cardHeader cardHeader--modern cardHeader--spaced">
              <div className="cardHeaderIcon">
                <IconDashboard />
              </div>
              <div>
                <h2>Flotte &amp; réseau</h2>
                <div className="muted">Les listes s'affichent au clic sur une tuile</div>
              </div>
            </div>
            <DashboardEntityTiles
              vehicules={vehicules}
              chauffeurs={chauffeurs}
              lignes={lignes}
              onOpen={setEntityListKind}
            />

            <div className="cardHeader cardHeader--modern cardHeader--spaced">
              <div className="cardHeaderIcon">
                <IconClock />
              </div>
              <div>
                <h2>Trajets récents</h2>
                <div className="muted">{trajets ? `${trajets.length} récent(s)` : "—"}</div>
              </div>
            </div>

            <TrajetsRecent trajets={trajets} onSelectTrajet={openTrajetDetail} />
          </section>
        </div>

        {chatOpen && !chatFullPage ? (
          <aside className="chatColumn">
            <div className="chatColumnHeader">
              <div className="chatColumnTitle">
                <span className="chatColumnTitleIcon">
                  <IconBot size={22} />
                </span>
                <div>
                  <h2>Assistant TranspoBot</h2>
                  <span className="muted chatColumnSubtitle">Questions en langage naturel</span>
                </div>
              </div>
              <div className="chatColumnHeaderActions">
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => setChatFullPage(true)}
                  aria-label="Agrandir le chat"
                  title="Plein écran"
                >
                  <IconExpand size={20} />
                </button>
                <button type="button" className="iconButton" onClick={closeChat} aria-label="Fermer l'assistant">
                  <IconClose size={22} />
                </button>
              </div>
            </div>

            <ChatPanel messages={messages} onSend={onSend} suggestions={suggestions} collapsible={true} />
          </aside>
        ) : null}
      </div>

      {chatOpen && chatFullPage ? (
        <div className="chatFullscreenOverlay" role="dialog" aria-modal="true" aria-label="Assistant plein écran">
          <aside className="chatFullscreenSidebar" aria-label="Historique des conversations">
            <div className="chatFullscreenSidebarHeader">
              <h3 className="chatFullscreenSidebarTitle">Conversations</h3>
              <button type="button" className="chatNewChatBtn chatNewChatBtn--sidebar" onClick={startNewChat}>
                <span className="chatNewChatIcon" aria-hidden>✦</span>
                Nouveau chat
              </button>
            </div>
            <div className="chatFullscreenSidebarBody">
              {archivedConversations.length === 0 ? (
                <p className="chatArchiveEmpty muted">
                  Fermez le chat pour archiver une conversation. Vous pourrez la reprendre ici.
                </p>
              ) : (
                <ul className="chatArchiveList">
                  {archivedConversations.map((conv) => (
                    <li key={conv.id}>
                      <button
                        type="button"
                        className={`chatArchiveItem ${conv.id === activeConversationId ? "chatArchiveItem--active" : ""}`}
                        onClick={() => resumeConversation(conv)}
                      >
                        <span className="chatArchiveItemTitle">{conv.title || "Conversation"}</span>
                        {conv.updatedAt ? (
                          <span className="chatArchiveItemDate">
                            {new Date(conv.updatedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
          <div className="chatFullscreenMain">
            <div className="chatColumnHeader chatFullscreenMainHeader">
              <div className="chatColumnTitle">
                <span className="chatColumnTitleIcon">
                  <IconBot size={22} />
                </span>
                <div>
                  <h2>Assistant TranspoBot</h2>
                  <span className="muted chatColumnSubtitle">Plein écran</span>
                </div>
              </div>
              <div className="chatColumnHeaderActions">
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => setChatFullPage(false)}
                  aria-label="Réduire le chat"
                  title="Retour au panneau latéral"
                >
                  <IconContract size={20} />
                </button>
                <button type="button" className="iconButton" onClick={closeChat} aria-label="Fermer l'assistant">
                  <IconClose size={22} />
                </button>
              </div>
            </div>
            <div className="chatFullscreenBody">
              <div className="chatFullscreenPanel">
                <ChatPanel
                  messages={messages}
                  onSend={onSend}
                  suggestions={suggestions}
                  onNewChat={startNewChat}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={`chatFab ${chatOpen ? "chatFab--active" : ""}`}
        onClick={() => (chatOpen ? closeChat() : setChatOpen(true))}
        aria-label={chatOpen ? "Fermer le chat" : "Ouvrir l'assistant TranspoBot"}
        aria-expanded={chatOpen}
      >
        {chatOpen ? <IconClose size={26} /> : <IconChat size={26} />}
      </button>

      {statModalOpen ? (
        <StatDetailModal
          detail={statDetail}
          loading={statLoading}
          error={statError}
          loadingTitle={statLoadingTitle}
          onClose={closeStatModal}
          onTrajetStatutChange={changeTrajetStatutFromStatModal}
          onTrajetIncident={(id) => setQuickIncidentTrajetId(id)}
          onIncidentResolu={resolveIncident}
          onVehiculeStatutChange={changeVehiculeStatutFromStatModal}
          onStatDetailReload={reloadStatDetail}
        />
      ) : null}

      {trajetModalOpen ? (
        <TrajetDetailModal
          data={trajetData}
          loading={trajetLoading}
          error={trajetError}
          onClose={closeTrajetModal}
          onTerminerTrajet={completeTrajetEnCours}
          onDeclarerIncidentTrajet={(id) => setQuickIncidentTrajetId(id)}
          onIncidentResolu={resolveIncident}
        />
      ) : null}

      {quickIncidentTrajetId != null ? (
        <IncidentQuickModal
          trajetId={quickIncidentTrajetId}
          onClose={() => setQuickIncidentTrajetId(null)}
          onSuccess={refreshAfterIncident}
        />
      ) : null}

      {chauffeurModalOpen ? (
        <ChauffeurDetailModal
          data={chauffeurData}
          loading={chauffeurLoading}
          error={chauffeurError}
          onClose={closeChauffeurModal}
          onOpenTrajet={(tid) => openTrajetDetail(tid, { closeChauffeur: true })}
          onChauffeurDisponibiliteChange={changeChauffeurDisponibiliteFromModal}
        />
      ) : null}

      {ligneModalOpen ? (
        <LigneDetailModal data={ligneData} loading={ligneLoading} error={ligneError} onClose={closeLigneModal} />
      ) : null}

      {vehiculeModalOpen ? (
        <VehiculeDetailModal
          data={vehiculeData}
          loading={vehiculeLoading}
          error={vehiculeError}
          onClose={closeVehiculeModal}
          onOpenTrajet={(tid) => openTrajetDetail(tid, { closeVehicule: true })}
          onVehiculeStatutChange={changeVehiculeStatutFromStatModal}
        />
      ) : null}

      {entityListKind ? (
        <EntityListModal
          key={entityListKind}
          kind={entityListKind}
          vehicules={vehicules}
          chauffeurs={chauffeurs}
          lignes={lignes}
          onClose={closeEntityListModal}
          onSelectVehicule={openVehiculeFromList}
          onSelectChauffeur={openChauffeurFromList}
          onSelectLigne={openLigneFromList}
        />
      ) : null}

      {reportModalOpen ? (
        <ReportModal onClose={() => setReportModalOpen(false)} />
      ) : null}

      {userMgmtOpen && isAdmin ? (
        <UserManagementPanel
          onClose={() => setUserMgmtOpen(false)}
          currentUserId={currentUser.id}
        />
      ) : null}
    </div>
  );
}
