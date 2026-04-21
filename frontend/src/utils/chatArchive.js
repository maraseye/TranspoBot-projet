const ARCHIVE_KEY = "transpobot_chat_archive_v2";

function nextId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deriveTitle(messages) {
  const first = (messages || []).find((m) => m.role === "user");
  const t = (first?.text || "").trim();
  if (!t) return "Conversation";
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}

export function loadArchive() {
  if (typeof window === "undefined") return { conversations: [] };
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return { conversations: [] };
    const p = JSON.parse(raw);
    if (p && Array.isArray(p.conversations)) {
      return { conversations: p.conversations.filter((c) => c && c.id && Array.isArray(c.messages)) };
    }
  } catch {
    /* ignore */
  }
  return { conversations: [] };
}

export function saveArchive(data) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/** Enregistre une conversation fermée (nouvelle ou mise à jour si id fourni). */
export function saveClosedConversation(messages, existingId = null) {
  const hasUser = (messages || []).some((m) => m.role === "user");
  if (!hasUser) return null;

  const data = loadArchive();
  const payload = {
    id: existingId || nextId(),
    updatedAt: new Date().toISOString(),
    title: deriveTitle(messages),
    messages: JSON.parse(JSON.stringify(messages)),
  };

  const idx = existingId ? data.conversations.findIndex((c) => c.id === existingId) : -1;
  if (idx >= 0) {
    data.conversations[idx] = payload;
  } else {
    data.conversations.unshift(payload);
  }
  data.conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  data.conversations = data.conversations.slice(0, 60);
  saveArchive(data);
  return payload.id;
}
