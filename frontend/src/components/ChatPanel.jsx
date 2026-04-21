import { useEffect, useRef, useState } from "react";
import { IconBot, IconUser, IconChevronRight } from "./Icons.jsx";
import { asciiDisplay } from "../utils/displayText.js";

function bubbleClass(role) {
  return role === "user" ? "bubble user" : "bubble bot";
}

export default function ChatPanel({ messages, onSend, suggestions = [], onNewChat, collapsible = false }) {
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // When collapsible=true the suggestions are hidden by default; the user clicks a button to toggle them
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    setIsLoading(last?.role === "bot" && (last?.text || "").includes("Analyse en cours"));
  }, [messages]);

  async function handleSend() {
    const v = inputVal.trim();
    if (!v || isLoading) return;
    setInputVal("");
    await onSend(v);
    // Remet le focus sur l'input après l'envoi
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  return (
    <>
      {onNewChat ? (
        <div className="chatNewChatBar">
          <button type="button" className="chatNewChatBtn" onClick={onNewChat}>
            <span className="chatNewChatIcon" aria-hidden>✦</span>
            Nouveau chat
          </button>
        </div>
      ) : null}

      {hasSuggestions && collapsible ? (
        <div className="suggestionsToggleRow">
          <button
            type="button"
            className="suggestionsToggleBtn"
            onClick={() => setSuggestionsOpen((o) => !o)}
            aria-expanded={suggestionsOpen}
          >
            <span className="suggestionsToggleDot" aria-hidden />
            Questions rapides
            <span className="suggestionsToggleArrow" data-open={suggestionsOpen} aria-hidden>▾</span>
          </button>
        </div>
      ) : null}

      {hasSuggestions && (!collapsible || suggestionsOpen) ? (
        <div className={`suggestions${collapsible ? " suggestions--collapsible" : ""}`}>
          {suggestions.map((s) => {
            const Ico = s.Icon;
            return (
              <button
                key={s.label}
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  if (isLoading) return;
                  setInputVal("");
                  if (collapsible) setSuggestionsOpen(false);
                  await onSend(s.question);
                }}
              >
                <span className="suggestionIcon" aria-hidden>
                  {Ico ? <Ico size={18} /> : null}
                </span>
                <span className="suggestionLabel">{s.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Zone de chat */}
      <div className="chatBox" ref={chatBoxRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.role === "bot" && (
              <div className="avatar botAvatar" aria-hidden>
                <IconBot size={18} />
              </div>
            )}
            <div className={`${bubbleClass(m.role)} bubbleText`}>
              {asciiDisplay(m.text)}
            </div>
            {m.role === "user" && (
              <div className="avatar userAvatar" aria-hidden>
                <IconUser size={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Zone de saisie */}
      <div className="chatInputRow">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          maxLength={2000}
          placeholder="Posez votre question en français..."
          disabled={isLoading}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button type="button" className="chatSendBtn" disabled={isLoading || !inputVal.trim()} onClick={handleSend}>
          {isLoading ? <span className="spinner" /> : (
            <>
              <span>Envoyer</span>
              <IconChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </>
  );
}
