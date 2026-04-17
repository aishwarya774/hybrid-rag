import { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const API = "";

// ── Icons (inline SVG to avoid extra deps) ──────────────────
const Icon = {
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  File: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Bot: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2a3 3 0 0 1 3 3v6H9V5a3 3 0 0 1 3-3z"/>
      <circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Cpu: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  Cloud: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Zap: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  NewChat: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  History: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Model: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
};

// ── Chat History Helpers ────────────────────────────────────
const HISTORY_KEY = "hybridrag_chat_sessions";
const CURRENT_KEY = "hybridrag_current_session";

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveSessions(sessions) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
}

function loadCurrentId() {
  return localStorage.getItem(CURRENT_KEY) || null;
}

function saveCurrentId(id) {
  localStorage.setItem(CURRENT_KEY, id);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const WELCOME_MSG = {
  role: "assistant",
  content: "Hello! I'm your Hybrid RAG assistant.\n\nUpload documents on the left, then ask me anything about them. I'll automatically choose between local Ollama models and OpenAI based on your query — or you can force a provider below.",
};

// ── Provider Badge ───────────────────────────────────────────
function ProviderBadge({ provider, model, reason }) {
  const isLocal = provider === "ollama";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "2px 8px", borderRadius: "20px", fontSize: "11px",
      background: isLocal ? "rgba(0,229,160,0.12)" : "rgba(99,102,241,0.12)",
      border: `1px solid ${isLocal ? "rgba(0,229,160,0.3)" : "rgba(99,102,241,0.3)"}`,
      color: isLocal ? "#00e5a0" : "#818cf8",
    }}>
      {isLocal ? <Icon.Cpu /> : <Icon.Cloud />}
      {isLocal ? "Local" : "OpenAI"} · {model}
    </div>
  );
}

// ── Source Citations ─────────────────────────────────────────
function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: "10px" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: "5px",
        background: "none", border: "none", color: "#6b7280",
        fontSize: "11px", cursor: "pointer", padding: 0,
        letterSpacing: "0.5px",
      }}>
        <Icon.File /> {sources.length} source{sources.length > 1 ? "s" : ""}
        <span style={{ transform: open ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>
          <Icon.ChevronDown />
        </span>
      </button>
      {open && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {sources.map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "6px", padding: "8px 12px",
            }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600" }}>
                {s.source} {s.page > 0 && `· p.${s.page}`}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px", lineHeight: "1.5" }}>
                {s.snippet}…
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: "12px", alignItems: "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeSlideIn 0.25s ease",
    }}>
      {/* Avatar */}
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser
          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
          : "linear-gradient(135deg, #0f172a, #1e293b)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
        color: isUser ? "#fff" : "#94a3b8",
      }}>
        {isUser ? <Icon.User /> : <Icon.Bot />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "75%", minWidth: "60px" }}>
        <div style={{
          padding: "12px 16px",
          borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          background: isUser
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "rgba(255,255,255,0.05)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          fontSize: "14px", lineHeight: "1.6", color: isUser ? "#fff" : "#e2e8f0",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {msg.content}
          {msg.loading && (
            <span style={{ display: "inline-flex", gap: "3px", marginLeft: "6px" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: "#94a3b8",
                  animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </span>
          )}
        </div>

        {/* Meta */}
        {msg.provider && (
          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <ProviderBadge provider={msg.provider} model={msg.model} reason={msg.routing_reason} />
            {msg.routing_reason && (
              <span style={{ fontSize: "10px", color: "#4b5563", letterSpacing: "0.3px" }}>
                <Icon.Zap /> {msg.routing_reason}
              </span>
            )}
          </div>
        )}
        {msg.sources && <Sources sources={msg.sources} />}
      </div>
    </div>
  );
}

// ── Document Sidebar ─────────────────────────────────────────
function DocSidebar({ docs, onUpload, onDelete, uploading, sessions, currentSessionId, onNewChat, onSwitchSession }) {
  const onDrop = useCallback(acceptedFiles => {
    acceptedFiles.forEach(f => onUpload(f));
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "text/plain": [".txt"], "text/markdown": [".md"] },
    multiple: true,
  });

  const typeColor = { PDF: "#f87171", DOCX: "#60a5fa", TXT: "#a78bfa", MD: "#34d399" };

  const [showHistory, setShowHistory] = useState(false);

  return (
    <div style={{
      width: "260px", flexShrink: 0,
      background: "rgba(255,255,255,0.02)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* New Chat + History Toggle */}
      <div style={{ padding: "12px 12px 0", display: "flex", gap: "6px" }}>
        <button onClick={onNewChat} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          padding: "8px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)",
          background: "rgba(99,102,241,0.1)", color: "#818cf8", cursor: "pointer",
          fontSize: "11px", fontWeight: "600", letterSpacing: "0.3px",
          transition: "all 0.15s",
        }}>
          <Icon.NewChat /> New Chat
        </button>
        <button onClick={() => setShowHistory(!showHistory)} style={{
          padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)",
          background: showHistory ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
          color: showHistory ? "#818cf8" : "#6b7280", cursor: "pointer",
          display: "flex", alignItems: "center",
          transition: "all 0.15s",
        }}>
          <Icon.History />
        </button>
      </div>

      {/* Chat History Panel */}
      {showHistory && (
        <div style={{
          padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          maxHeight: "180px", overflowY: "auto",
        }}>
          <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "#4b5563", marginBottom: "6px" }}>
            RECENT CHATS
          </div>
          {sessions.length === 0 ? (
            <div style={{ fontSize: "11px", color: "#374151", textAlign: "center", padding: "8px 0" }}>
              No saved chats
            </div>
          ) : sessions.slice().reverse().map(s => (
            <div
              key={s.id}
              onClick={() => { onSwitchSession(s.id); setShowHistory(false); }}
              style={{
                padding: "6px 8px", borderRadius: "6px", cursor: "pointer",
                marginBottom: "3px", fontSize: "12px",
                background: s.id === currentSessionId ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                border: s.id === currentSessionId ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                color: s.id === currentSessionId ? "#818cf8" : "#9ca3af",
                transition: "all 0.15s",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {s.title || "Untitled chat"}
              <div style={{ fontSize: "9px", color: "#4b5563", marginTop: "2px" }}>
                {new Date(s.updatedAt).toLocaleDateString()} · {s.messages.length} msgs
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#4b5563", marginBottom: "12px" }}>
          KNOWLEDGE BASE
        </div>

        {/* Dropzone */}
        <div {...getRootProps()} style={{
          border: `1.5px dashed ${isDragActive ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "10px", padding: "16px 12px",
          textAlign: "center", cursor: "pointer",
          background: isDragActive ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
        }}>
          <input {...getInputProps()} />
          <div style={{ color: isDragActive ? "#818cf8" : "#4b5563", fontSize: "22px", marginBottom: "6px" }}>
            {uploading ? "⏳" : "📂"}
          </div>
          <div style={{ fontSize: "12px", color: isDragActive ? "#818cf8" : "#6b7280", lineHeight: "1.4" }}>
            {uploading ? "Ingesting…" : isDragActive ? "Drop to upload" : "Drop files or click"}
          </div>
          <div style={{ fontSize: "10px", color: "#374151", marginTop: "4px" }}>
            PDF · DOCX · TXT · MD
          </div>
        </div>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {docs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#374151", fontSize: "12px", marginTop: "24px" }}>
            No documents yet
          </div>
        ) : docs.map((doc, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 8px", borderRadius: "8px",
            marginBottom: "4px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
          >
            <span style={{
              fontSize: "9px", fontWeight: "700", letterSpacing: "0.5px",
              color: typeColor[doc.type] || "#9ca3af",
              background: `${typeColor[doc.type]}18` || "rgba(156,163,175,0.1)",
              padding: "2px 5px", borderRadius: "4px", flexShrink: 0,
            }}>
              {doc.type}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.name}
              </div>
              <div style={{ fontSize: "10px", color: "#4b5563" }}>{doc.size_kb} KB</div>
            </div>
            <button onClick={() => onDelete(doc.name)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#374151", padding: "2px", borderRadius: "4px",
              display: "flex", alignItems: "center",
              transition: "color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
              onMouseLeave={e => e.currentTarget.style.color = "#374151"}
            >
              <Icon.Trash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Bar ───────────────────────────────────────────────
function StatusBar({ status }) {
  if (!status) return null;
  const dot = (ok) => (
    <span style={{
      width: "6px", height: "6px", borderRadius: "50%", display: "inline-block",
      background: ok === "connected" || ok === "configured" ? "#00e5a0" :
                  ok === "not_configured" ? "#f59e0b" : "#f87171",
      boxShadow: ok === "connected" ? "0 0 6px #00e5a0" : "none",
    }} />
  );
  return (
    <div style={{
      display: "flex", gap: "16px", alignItems: "center",
      padding: "8px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(0,0,0,0.2)",
      fontSize: "11px", color: "#6b7280",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {dot(status.ollama)} Ollama {status.ollama}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {dot(status.openai)} OpenAI {status.openai}
      </span>
      {status.default_model && (
        <span style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "auto" }}>
          <Icon.Cpu /> {status.default_model}
        </span>
      )}
    </div>
  );
}

// ── Provider Selector ────────────────────────────────────────
function ProviderSelector({ value, onChange }) {
  const opts = [
    { v: null,     label: "Auto", icon: <Icon.Zap /> },
    { v: "ollama", label: "Local", icon: <Icon.Cpu /> },
    { v: "openai", label: "OpenAI", icon: <Icon.Cloud /> },
  ];
  return (
    <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
      {opts.map(o => (
        <button key={o.label} onClick={() => onChange(o.v)} style={{
          display: "flex", alignItems: "center", gap: "4px",
          padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
          fontSize: "11px", fontWeight: "600", letterSpacing: "0.3px",
          background: value === o.v ? "rgba(99,102,241,0.3)" : "transparent",
          color: value === o.v ? "#818cf8" : "#6b7280",
          transition: "all 0.15s",
        }}>
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Model Selector Dropdown ─────────────────────────────────
function ModelSelector({ models, selectedModel, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allModels = [
    ...(models.ollama_models || []).map(m => ({ name: m.name, provider: "ollama", size: m.size_gb, family: m.family })),
    ...(models.openai_models || []).map(m => ({ name: m.name, provider: "openai", size: null, family: "openai" })),
  ];

  if (allModels.length === 0) return null;

  const displayName = selectedModel || models.default_model || "auto";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        color: "#9ca3af", cursor: "pointer",
        fontSize: "11px", fontWeight: "600",
        transition: "all 0.15s",
      }}>
        <Icon.Model /> {displayName}
        <span style={{ transform: open ? "rotate(180deg)" : "none", display: "inline-flex", transition: "transform 0.2s" }}>
          <Icon.ChevronDown />
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", bottom: "100%", left: 0, marginBottom: "6px",
          background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px", padding: "6px", minWidth: "220px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 100, maxHeight: "240px", overflowY: "auto",
        }}>
          <div style={{ fontSize: "9px", letterSpacing: "1.5px", color: "#4b5563", padding: "4px 8px", marginBottom: "2px" }}>
            SELECT MODEL
          </div>
          {allModels.map(m => (
            <button
              key={m.name}
              onClick={() => { onSelect(m.name); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "8px", width: "100%",
                padding: "7px 10px", borderRadius: "6px", border: "none", cursor: "pointer",
                background: m.name === displayName ? "rgba(99,102,241,0.2)" : "transparent",
                color: m.name === displayName ? "#818cf8" : "#cbd5e1",
                fontSize: "12px", textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (m.name !== displayName) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (m.name !== displayName) e.currentTarget.style.background = "transparent"; }}
            >
              {m.provider === "ollama" ? <Icon.Cpu /> : <Icon.Cloud />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "500" }}>{m.name}</div>
                {m.size && <div style={{ fontSize: "10px", color: "#4b5563" }}>{m.size} GB</div>}
              </div>
              {m.name === displayName && (
                <span style={{ fontSize: "10px", color: "#00e5a0" }}>●</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  // --- Session management ---
  const [sessions, setSessions] = useState(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const saved = loadCurrentId();
    const existing = loadSessions();
    if (saved && existing.find(s => s.id === saved)) return saved;
    // Create initial session
    const id = generateId();
    const initial = { id, title: "New chat", messages: [WELCOME_MSG], createdAt: Date.now(), updatedAt: Date.now() };
    saveSessions([initial]);
    saveCurrentId(id);
    return id;
  });

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [WELCOME_MSG];

  const setMessages = (updater) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== currentSessionId) return s;
        const newMsgs = typeof updater === "function" ? updater(s.messages) : updater;
        // Auto-title from first user message
        let title = s.title;
        if (title === "New chat") {
          const firstUser = newMsgs.find(m => m.role === "user");
          if (firstUser) title = firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? "…" : "");
        }
        return { ...s, messages: newMsgs, title, updatedAt: Date.now() };
      });
      saveSessions(updated);
      return updated;
    });
  };

  const handleNewChat = () => {
    const id = generateId();
    const newSession = { id, title: "New chat", messages: [WELCOME_MSG], createdAt: Date.now(), updatedAt: Date.now() };
    setSessions(prev => {
      const updated = [...prev, newSession];
      saveSessions(updated);
      return updated;
    });
    setCurrentSessionId(id);
    saveCurrentId(id);
  };

  const handleSwitchSession = (id) => {
    setCurrentSessionId(id);
    saveCurrentId(id);
  };

  // --- Other state ---
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [provider, setProvider] = useState(null); // null = auto
  const [availableModels, setAvailableModels] = useState({ ollama_models: [], openai_models: [], default_model: "" });
  const [selectedModel, setSelectedModel] = useState(null); // null = use default
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch system status, docs, and models on mount
  useEffect(() => {
    fetch(`${API}/api/status`).then(r => r.json()).then(setStatus).catch(() => {});
    fetchDocs();
    fetch(`${API}/api/models/`).then(r => r.json()).then(setAvailableModels).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocs = async () => {
    try {
      const r = await fetch(`${API}/api/documents/`);
      const data = await r.json();
      setDocs(data);
    } catch {}
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      await fetch(`${API}/api/documents/upload`, { method: "POST", body: form });
      await fetchDocs();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name) => {
    try {
      await fetch(`${API}/api/documents/${encodeURIComponent(name)}`, { method: "DELETE" });
      await fetchDocs();
    } catch {}
  };

  // ── Streaming send handler ──────────────────────────────
  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg = { role: "user", content: q };
    const streamingMsg = { role: "assistant", content: "", loading: true };
    setMessages(prev => [...prev, userMsg, streamingMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          force_provider: provider,
          top_k: 5,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        // Fallback to non-streaming endpoint
        const fallbackRes = await fetch(`${API}/api/chat/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, force_provider: provider, top_k: 5, model: selectedModel }),
        });
        const data = await fallbackRes.json();
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: data.answer || data.detail || "No response.",
            provider: data.provider,
            model: data.model,
            routing_reason: data.routing_reason,
            sources: data.sources,
          },
        ]);
        return;
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let meta = {};
      let streamedContent = "";
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        let eventType = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            const data = JSON.parse(line.slice(6));

            if (eventType === "metadata") {
              meta = data;
            } else if (eventType === "token") {
              streamedContent += data.content;
              // Update the streaming message in place
              setMessages(prev => [
                ...prev.slice(0, -1),
                {
                  role: "assistant",
                  content: streamedContent,
                  loading: true,
                  provider: meta.provider,
                  model: meta.model,
                  routing_reason: meta.routing_reason,
                },
              ]);
            } else if (eventType === "sources") {
              sources = data;
            } else if (eventType === "error") {
              streamedContent += `\n\n⚠️ Error: ${data.detail}`;
            }
            eventType = null;
          }
        }
      }

      // Finalize the message (remove loading indicator, add sources)
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: streamedContent || "No response.",
          provider: meta.provider,
          model: meta.model,
          routing_reason: meta.routing_reason,
          sources,
        },
      ]);

    } catch (e) {
      console.error("Stream error:", e);
      // Fallback: try non-streaming
      try {
        const fallbackRes = await fetch(`${API}/api/chat/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, force_provider: provider, top_k: 5, model: selectedModel }),
        });
        const data = await fallbackRes.json();
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: data.answer || data.detail || "No response.",
            provider: data.provider,
            model: data.model,
            routing_reason: data.routing_reason,
            sources: data.sources,
          },
        ]);
      } catch {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "⚠️ Could not reach the backend. Is Docker running?" },
        ]);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060610; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1); } }
        textarea { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060610", color: "#e2e8f0" }}>

        {/* Header */}
        <div style={{
          padding: "14px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", gap: "14px",
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: "600", fontSize: "15px", letterSpacing: "-0.3px" }}>HybridRAG</div>
            <div style={{ fontSize: "11px", color: "#4b5563", letterSpacing: "0.5px" }}>
              LOCAL · CLOUD · UNIFIED
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#00e5a0", boxShadow: "0 0 8px #00e5a0",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: "11px", color: "#4b5563" }}>LIVE</span>
          </div>
        </div>

        <StatusBar status={status} />

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          <DocSidebar
            docs={docs}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploading}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSwitchSession={handleSwitchSession}
          />

          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {messages.map((msg, i) => <Message key={i} msg={msg} />)}
              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div style={{
              padding: "16px 24px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "#4b5563" }}>ROUTE:</span>
                <ProviderSelector value={provider} onChange={setProvider} />
                <span style={{ fontSize: "11px", color: "#4b5563", marginLeft: "8px" }}>MODEL:</span>
                <ModelSelector
                  models={availableModels}
                  selectedModel={selectedModel}
                  onSelect={setSelectedModel}
                />
              </div>

              <div style={{
                display: "flex", gap: "10px", alignItems: "flex-end",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px", padding: "10px 12px",
                transition: "border-color 0.2s",
              }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask anything about your documents… (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "#e2e8f0", fontSize: "14px", lineHeight: "1.5", resize: "none",
                    maxHeight: "120px", overflowY: "auto",
                  }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: loading || !input.trim()
                      ? "rgba(99,102,241,0.2)"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", flexShrink: 0,
                    transition: "all 0.2s", transform: "scale(1)",
                  }}
                  onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Icon.Send />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
