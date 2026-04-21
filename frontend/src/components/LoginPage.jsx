import { useState } from "react";
import { IconBus } from "./Icons.jsx";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data?.detail || "Identifiants incorrects.");
        return;
      }
      // sessionStorage : effacée automatiquement à la fermeture du navigateur
      // → l'utilisateur devra se reconnecter à chaque nouvelle session
      sessionStorage.setItem("transpobot_token", data.token);
      if (data.refresh_token) {
        sessionStorage.setItem("transpobot_refresh_token", data.refresh_token);
      }
      sessionStorage.setItem("transpobot_user", JSON.stringify({
        id: data.id,
        username: data.username,
        role: data.role,
      }));
      onLogin({ id: data.id, username: data.username, role: data.role });
    } catch {
      setError("Erreur de connexion au serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginRoot">
      {/* Blobs d'arrière-plan animés */}
      <div className="loginBg">
        <div className="loginBlob loginBlob--1" />
        <div className="loginBlob loginBlob--2" />
        <div className="loginBlob loginBlob--3" />
      </div>

      <div className="loginCard">
        {/* Logo */}
        <div className="loginLogo">
          <div className="loginLogoIcon">
            <IconBus size={36} />
          </div>
          <div className="loginBrand">
            <h1 className="loginTitle">TranspoBot</h1>
            <p className="loginSubtitle">Plateforme de Gestion Transport</p>
          </div>
        </div>

        <div className="loginDivider" />

        <h2 className="loginFormTitle">Connexion</h2>
        <p className="loginFormDesc">Accédez à votre espace de gestion</p>

        <form className="loginForm" onSubmit={handleSubmit} autoComplete="off">
          {/* Champ identifiant */}
          <div className="loginField">
            <label className="loginLabel" htmlFor="login-username">
              Identifiant
            </label>
            <div className="loginInputWrap">
              <span className="loginInputIcon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="login-username"
                className="loginInput"
                type="text"
                placeholder="Votre identifiant"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Champ mot de passe */}
          <div className="loginField">
            <label className="loginLabel" htmlFor="login-password">
              Mot de passe
            </label>
            <div className="loginInputWrap">
              <span className="loginInputIcon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                className="loginInput"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="loginPasswordToggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="loginError" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="loginBtn"
            disabled={loading || !username.trim() || !password.trim()}
            id="login-submit"
          >
            {loading ? (
              <>
                <span className="loginSpinner" />
                Connexion en cours…
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>


      </div>
    </div>
  );
}
