const TOKEN_KEY = "transpobot_token";
const REFRESH_KEY = "transpobot_refresh_token";
const USER_KEY = "transpobot_user";

// sessionStorage : effacée automatiquement à la fermeture du navigateur
// → l'utilisateur doit se reconnecter à chaque nouvelle session
const authStorage = sessionStorage;

function authHeader() {
  const token = authStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonSafe(r) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

// ── Auto-refresh logic ────────────────────────────────────────────
let _refreshPromise = null; // Éviter les refreshs concurrents

async function tryRefreshToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = authStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;
    try {
      const r = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!r.ok) {
        // Refresh token expiré ou révoqué → forcer la déconnexion
        authStorage.removeItem(TOKEN_KEY);
        authStorage.removeItem(REFRESH_KEY);
        authStorage.removeItem(USER_KEY);
        window.dispatchEvent(new CustomEvent("transpobot:logout"));
        return false;
      }
      const data = await r.json();
      authStorage.setItem(TOKEN_KEY, data.token);
      // Mettre à jour les infos user si besoin
      const user = { id: data.id, username: data.username, role: data.role };
      authStorage.setItem(USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent("transpobot:tokenRefreshed", { detail: user }));
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/**
 * Fetch avec retry automatique après refresh si 401.
 * On ne réessaie qu'une fois pour éviter les boucles infinies.
 */
async function fetchWithAuth(url, options = {}) {
  const headers = { ...authHeader(), ...(options.headers || {}) };
  const r = await fetch(url, { ...options, headers });

  if (r.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Rejouer la requête avec le nouveau token
      const headers2 = { ...authHeader(), ...(options.headers || {}) };
      return fetch(url, { ...options, headers: headers2 });
    }
  }
  return r;
}



export async function fetchStats() {
  const r = await fetchWithAuth("/api/stats");
  if (!r.ok) throw new Error(`GET /api/stats -> ${r.status}`);
  return r.json();
}

export async function fetchTrajetsRecent() {
  const r = await fetchWithAuth("/api/trajets/recent");
  if (!r.ok) throw new Error(`GET /api/trajets/recent -> ${r.status}`);
  return r.json();
}

export async function fetchChatAnswer(question, history = []) {
  const r = await fetchWithAuth("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `POST /api/chat -> ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchStatDetail(statKey, params = {}) {
  const qs = new URLSearchParams();
  if (params.year != null) qs.set("year", String(params.year));
  if (params.month != null) qs.set("month", String(params.month));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const r = await fetch(`/api/stats/detail/${encodeURIComponent(statKey)}${suffix}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/stats/detail -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchTrajetDetail(trajetId) {
  const r = await fetch(`/api/trajets/${trajetId}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/trajets -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchChauffeurs() {
  const r = await fetchWithAuth("/api/chauffeurs");
  if (!r.ok) throw new Error(`GET /api/chauffeurs -> ${r.status}`);
  return r.json();
}

export async function fetchChauffeurDetail(id) {
  const r = await fetch(`/api/chauffeurs/${id}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/chauffeurs -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchLignes() {
  const r = await fetchWithAuth("/api/lignes");
  if (!r.ok) throw new Error(`GET /api/lignes -> ${r.status}`);
  return r.json();
}

export async function fetchLigneDetail(id) {
  const r = await fetch(`/api/lignes/${id}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/lignes -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchVehicules() {
  const r = await fetchWithAuth("/api/vehicules");
  if (!r.ok) throw new Error(`GET /api/vehicules -> ${r.status}`);
  return r.json();
}

export async function fetchVehiculeDetail(id) {
  const r = await fetch(`/api/vehicules/${id}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/vehicules -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchIncidents() {
  const r = await fetch("/api/incidents");
  if (!r.ok) throw new Error(`GET /api/incidents -> ${r.status}`);
  return r.json();
}

export async function fetchTrajetsList() {
  const r = await fetch("/api/trajets");
  if (!r.ok) throw new Error(`GET /api/trajets -> ${r.status}`);
  return r.json();
}

export async function fetchTrajetsManage() {
  const r = await fetch("/api/trajets/manage");
  if (!r.ok) throw new Error(`GET /api/trajets/manage -> ${r.status}`);
  return r.json();
}

async function jsonOrThrow(r, label) {
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `${label} -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function createChauffeur(body) {
  const r = await fetchWithAuth("/api/chauffeurs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "POST /api/chauffeurs");
}

export async function updateChauffeur(id, body) {
  const r = await fetchWithAuth(`/api/chauffeurs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "PUT /api/chauffeurs");
}

export async function deleteChauffeur(id) {
  const r = await fetchWithAuth(`/api/chauffeurs/${id}`, { method: "DELETE" });
  return jsonOrThrow(r, "DELETE /api/chauffeurs");
}

export async function createVehicule(body) {
  const r = await fetchWithAuth("/api/vehicules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "POST /api/vehicules");
}

export async function updateVehicule(id, body) {
  const r = await fetchWithAuth(`/api/vehicules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "PUT /api/vehicules");
}

export async function deleteVehicule(id) {
  const r = await fetchWithAuth(`/api/vehicules/${id}`, { method: "DELETE" });
  return jsonOrThrow(r, "DELETE /api/vehicules");
}

export async function createIncident(body) {
  const r = await fetchWithAuth("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "POST /api/incidents");
}

export async function updateIncident(id, body) {
  const r = await fetchWithAuth(`/api/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "PUT /api/incidents");
}

export async function deleteIncident(id) {
  const r = await fetchWithAuth(`/api/incidents/${id}`, { method: "DELETE" });
  return jsonOrThrow(r, "DELETE /api/incidents");
}

export async function createLigne(body) {
  const r = await fetchWithAuth("/api/lignes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "POST /api/lignes");
}

export async function updateLigne(id, body) {
  const r = await fetchWithAuth(`/api/lignes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "PUT /api/lignes");
}

export async function deleteLigne(id) {
  const r = await fetchWithAuth(`/api/lignes/${id}`, { method: "DELETE" });
  return jsonOrThrow(r, "DELETE /api/lignes");
}

export async function createTrajet(body) {
  const r = await fetchWithAuth("/api/trajets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "POST /api/trajets");
}

export async function updateTrajet(id, body) {
  const r = await fetchWithAuth(`/api/trajets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "PUT /api/trajets");
}

export async function deleteTrajet(id) {
  const r = await fetchWithAuth(`/api/trajets/${id}`, { method: "DELETE" });
  return jsonOrThrow(r, "DELETE /api/trajets");
}

export async function fetchRapportJournalier(date) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  const r = await fetchWithAuth(`/api/rapports/journalier${qs}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/rapports/journalier -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchRapportMensuel(year, month) {
  const qs = year != null && month != null ? `?year=${year}&month=${month}` : "";
  const r = await fetchWithAuth(`/api/rapports/mensuel${qs}`);
  const data = await parseJsonSafe(r);
  if (!r.ok) {
    const msg = (data && data.detail) || `GET /api/rapports/mensuel -> ${r.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

// ── Auth & Utilisateurs ────────────────────────────────────────

export async function fetchLogin(username, password) {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await jsonOrThrow(r, "POST /api/auth/login");
  // Stocker les tokens en sessionStorage (effacée à la fermeture du navigateur)
  authStorage.setItem(TOKEN_KEY, data.token);
  if (data.refresh_token) {
    authStorage.setItem(REFRESH_KEY, data.refresh_token);
  }
  return data;
}

export async function fetchLogout() {
  const refreshToken = authStorage.getItem(REFRESH_KEY);
  if (refreshToken) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Ignorer les erreurs réseau au logout
    }
  }
  // Note : la suppression de la sessionStorage est gérée par App.jsx handleLogout
}

export async function fetchMe() {
  const r = await fetchWithAuth("/api/auth/me");
  return jsonOrThrow(r, "GET /api/auth/me");
}

export async function fetchUtilisateurs() {
  const r = await fetchWithAuth("/api/utilisateurs");
  return jsonOrThrow(r, "GET /api/utilisateurs");
}

export async function createUtilisateur(body) {
  const r = await fetchWithAuth("/api/utilisateurs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "POST /api/utilisateurs");
}

export async function updateUtilisateur(id, body) {
  const r = await fetchWithAuth(`/api/utilisateurs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "PUT /api/utilisateurs");
}

export async function deleteUtilisateur(id) {
  const r = await fetchWithAuth(`/api/utilisateurs/${id}`, { method: "DELETE" });
  return jsonOrThrow(r, "DELETE /api/utilisateurs");
}
