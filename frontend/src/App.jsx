/**
 * App — Shell d'authentification TranspoBot
 *
 * Seul responsable de :
 *  - Lire / persister la session (sessionStorage)
 *  - Afficher LoginPage ou AppDashboard selon l'état de connexion
 *
 * Tous les hooks du dashboard sont dans AppDashboard.jsx, ce qui respecte
 * les règles React (pas de hooks conditionnels / après un early-return).
 */
import { useEffect, useLayoutEffect, useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import AppDashboard from "./AppDashboard.jsx";
import { fetchLogout } from "./api.js";

const AUTH_USER_KEY = "transpobot_user";

function getStoredUser() {
  try {
    // sessionStorage : effacée à la fermeture du navigateur
    const raw = sessionStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  // isReady évite un flash de page vide avant que sessionStorage soit lu
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    setIsReady(true);
  }, []);

  // Écouter les événements du système de refresh (depuis api.js)
  useEffect(() => {
    function onForceLogout() {
      sessionStorage.removeItem("transpobot_token");
      sessionStorage.removeItem("transpobot_refresh_token");
      sessionStorage.removeItem(AUTH_USER_KEY);
      setCurrentUser(null);
    }
    function onTokenRefreshed(e) {
      if (e.detail) {
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(e.detail));
        setCurrentUser(e.detail);
      }
    }
    window.addEventListener("transpobot:logout", onForceLogout);
    window.addEventListener("transpobot:tokenRefreshed", onTokenRefreshed);
    return () => {
      window.removeEventListener("transpobot:logout", onForceLogout);
      window.removeEventListener("transpobot:tokenRefreshed", onTokenRefreshed);
    };
  }, []);

  function handleLogin(user) {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }

  async function handleLogout() {
    await fetchLogout();
    sessionStorage.removeItem("transpobot_token");
    sessionStorage.removeItem("transpobot_refresh_token");
    sessionStorage.removeItem(AUTH_USER_KEY);
    setCurrentUser(null);
  }

  // Attendre le montage complet avant de décider quoi afficher
  if (!isReady) return null;

  // Pas connecté → page de connexion
  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  // Connecté → dashboard complet (tous les hooks sont dans AppDashboard)
  return <AppDashboard currentUser={currentUser} onLogout={handleLogout} />;
}
