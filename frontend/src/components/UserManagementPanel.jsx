import { useEffect, useState, useCallback } from "react";

const TOKEN_KEY = "transpobot_token";
const REFRESH_KEY = "transpobot_refresh_token";
const USER_KEY = "transpobot_user";
const BASE = "/api";

// sessionStorage : effacée automatiquement à la fermeture du navigateur
const authStorage = sessionStorage;

function authHeader() {
  const token = authStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auto-refresh : si le token est expiré (401), on tente un refresh avant de rejeter
let _refreshPromise = null;
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
        authStorage.removeItem(TOKEN_KEY);
        authStorage.removeItem(REFRESH_KEY);
        authStorage.removeItem(USER_KEY);
        window.dispatchEvent(new CustomEvent("transpobot:logout"));
        return false;
      }
      const data = await r.json();
      authStorage.setItem(TOKEN_KEY, data.token);
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

async function apiCall(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body != null ? JSON.stringify(body) : undefined,
  };
  let r = await fetch(`${BASE}${path}`, opts);

  // Si 401 → tenter le refresh et rejouer la requête une fois
  if (r.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      r = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
    }
  }

  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.detail || `${method} ${path} → ${r.status}`);
  return data;
}

const ROLE_LABELS = { admin: "Admin", gestionnaire: "Gestionnaire" };
const ROLE_CLASS = { admin: "userBadge--admin", gestionnaire: "userBadge--gestionnaire" };

function UserFormModal({ user, onClose, onSaved, currentUserId }) {
  const isEdit = Boolean(user);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "gestionnaire");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let result;
      if (isEdit) {
        const body = {};
        if (username.trim() !== user.username) body.username = username.trim();
        if (password.trim()) body.password = password.trim();
        if (role !== user.role) body.role = role;
        result = await apiCall("PUT", `/utilisateurs/${user.id}`, body);
      } else {
        result = await apiCall("POST", "/utilisateurs", {
          username: username.trim(),
          password: password.trim(),
          role,
        });
      }
      onSaved(result);
    } catch (err) {
      setError(err.message || "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label={isEdit ? "Modifier l'utilisateur" : "Créer un utilisateur"}>
      <div className="modalContent userFormModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>{isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
          <button type="button" className="iconButton" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="userForm">
          <div className="formGroup">
            <label htmlFor="uf-username">Identifiant</label>
            <input
              id="uf-username"
              type="text"
              className="formInput"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              disabled={loading}
            />
          </div>
          <div className="formGroup">
            <label htmlFor="uf-password">
              {isEdit ? "Nouveau mot de passe (laisser vide = inchangé)" : "Mot de passe"}
            </label>
            <input
              id="uf-password"
              type="password"
              className="formInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              minLength={4}
              maxLength={200}
              disabled={loading}
              placeholder={isEdit ? "Laisser vide pour ne pas changer" : ""}
            />
          </div>
          <div className="formGroup">
            <label htmlFor="uf-role">Rôle</label>
            <select
              id="uf-role"
              className="formSelect"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading || (isEdit && user?.id === currentUserId)}
            >
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {error && (
            <div className="formError userFormError">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          <div className="formActions">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagementPanel({ onClose, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formModal, setFormModal] = useState(null); // null | { user } | { user: null }
  const [actionLoading, setActionLoading] = useState(null); // id en cours d'action

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall("GET", "/utilisateurs");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleToggleBloque(user) {
    setActionLoading(user.id);
    try {
      await apiCall("PUT", `/utilisateurs/${user.id}`, { bloque: !user.bloque });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, bloque: !u.bloque } : u))
      );
    } catch (err) {
      alert(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Supprimer l'utilisateur « ${user.username} » ? Cette action est irréversible.`)) return;
    setActionLoading(user.id);
    try {
      await apiCall("DELETE", `/utilisateurs/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      alert(err.message || "Impossible de supprimer cet utilisateur.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleSaved(updatedUser) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === updatedUser.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedUser;
        return copy;
      }
      return [updatedUser, ...prev];
    });
    setFormModal(null);
  }

  return (
    <>
      <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Gestion des utilisateurs" onClick={onClose}>
        <div className="modalContent userMgmtPanel" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modalHeader">
            <div className="userMgmtTitle">
              <div className="userMgmtTitleIcon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h2>Gestion des utilisateurs</h2>
                <span className="muted">Administrateurs et gestionnaires</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setFormModal({ user: null })}
                id="user-mgmt-add-btn"
              >
                + Ajouter
              </button>
              <button type="button" className="iconButton" onClick={onClose} aria-label="Fermer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="userMgmtBody">
            {loading && (
              <div className="userMgmtLoading">
                <div className="spinner" />
                <span>Chargement…</span>
              </div>
            )}
            {!loading && error && (
              <div className="userMgmtError">
                <span>{error}</span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={loadUsers}>
                  Réessayer
                </button>
              </div>
            )}
            {!loading && !error && (
              <div className="userTable">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Identifiant</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="userTableEmpty">Aucun utilisateur trouvé.</td>
                      </tr>
                    )}
                    {users.map((u) => {
                      const isSelf = u.id === currentUserId;
                      const isActing = actionLoading === u.id;
                      const dateStr = u.created_at
                        ? new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                        : "—";
                      return (
                        <tr key={u.id} className={isSelf ? "userTable--self" : ""}>
                          <td className="userTableId">{u.id}</td>
                          <td className="userTableUsername">
                            {u.username}
                            {isSelf && <span className="userSelfBadge"> (moi)</span>}
                          </td>
                          <td>
                            <span className={`userBadge ${ROLE_CLASS[u.role] || ""}`}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`userBadge ${u.bloque ? "userBadge--bloque" : "userBadge--actif"}`}>
                              {u.bloque ? "Bloqué" : "Actif"}
                            </span>
                          </td>
                          <td className="userTableDate">{dateStr}</td>
                          <td>
                            <div className="userActions">
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                title="Modifier"
                                onClick={() => setFormModal({ user: u })}
                                disabled={isActing}
                              >
                                ✏️
                              </button>
                              {!isSelf && (
                                <>
                                  <button
                                    type="button"
                                    className={`btn btn--sm ${u.bloque ? "btn--success" : "btn--warning"}`}
                                    title={u.bloque ? "Débloquer" : "Bloquer"}
                                    onClick={() => handleToggleBloque(u)}
                                    disabled={isActing}
                                  >
                                    {isActing ? "…" : u.bloque ? "🔓" : "🔒"}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn--danger btn--sm"
                                    title="Supprimer"
                                    onClick={() => handleDelete(u)}
                                    disabled={isActing}
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {formModal !== null && (
        <UserFormModal
          user={formModal.user}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
