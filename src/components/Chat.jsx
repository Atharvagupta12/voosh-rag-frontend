import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../hooks/useChat.js";
import { formatDuration, timeAgo } from "../lib/format.js";
import { Composer } from "./Composer.jsx";
import { ArrowDown, ArrowLeft, ArrowRight, Plus } from "./Icons.jsx";
import { Logo } from "./Logo.jsx";
import { Message } from "./Message.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

const STARTERS = [
  "What are the biggest stories right now?",
  "Summarise today's business and economy news",
  "What's new in technology and AI?",
];

function EmptyState({ meta, onPick }) {
  const suggestions = useMemo(() => {
    const fromHeadlines = (meta?.headlines ?? []).slice(0, 3).map((h) => ({
      label: h.title,
      kicker: h.source,
      prompt: `What's the story behind "${h.title}"?`,
    }));
    return [...STARTERS.map((s) => ({ label: s, kicker: "Briefing", prompt: s })), ...fromHeadlines].slice(0, 6);
  }, [meta]);

  return (
    <div className="empty">
      <h1 className="empty-title">
        What would you like <em>to know?</em>
      </h1>
      <p className="empty-sub">
        {meta?.articleCount
          ? `Answers draw on ${meta.articleCount} recent articles from ${meta.sources.length} newsrooms${
              meta.latestPublishedAt ? `, the newest published ${timeAgo(meta.latestPublishedAt)}` : ""
            }.`
          : "Ask about current events. Every answer links to the articles it came from."}
      </p>
      <div className="suggestions">
        {suggestions.map((s) => (
          <button key={s.prompt} type="button" className="suggestion" onClick={() => onPick(s.prompt)}>
            <span className="suggestion-kicker">{s.kicker}</span>
            <span className="suggestion-label">{s.label}</span>
            <ArrowRight size={16} className="suggestion-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RestoringSkeleton() {
  return (
    <div className="skeleton" aria-label="Loading your conversation" role="status">
      <div className="sk sk-user" />
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
      <div className="sk sk-user" />
      <div className="sk sk-line" />
    </div>
  );
}

export function Chat({ meta, theme, onToggleTheme, onHome, initialPrompt, onInitialPromptUsed }) {
  const { messages, isStreaming, isRestoring, ttlSeconds, send, stop, retry, reset, sessionId } = useChat();
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleSend = useCallback(
    (text) => {
      stickRef.current = true;
      return send(text);
    },
    [send]
  );

  // Keep pinned to the latest message while the user hasn't scrolled up.
  useLayoutEffect(() => {
    if (stickRef.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distance < 80;
    setShowJump(distance > 240);
  };

  // A question chosen on the landing page is sent once history has loaded.
  useEffect(() => {
    if (initialPrompt && !isRestoring) {
      onInitialPromptUsed();
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isRestoring, handleSend, onInitialPromptUsed]);

  // Focus the composer when ready (not on touch devices, where it pops the keyboard).
  useEffect(() => {
    if (!isRestoring && window.matchMedia?.("(pointer: fine)").matches) composerRef.current?.focus();
  }, [isRestoring]);

  // "/" focuses the composer from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        composerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const newChat = () => {
    reset();
    stickRef.current = true;
    composerRef.current?.focus();
  };

  const hasMessages = messages.length > 0;
  const expiry = formatDuration(ttlSeconds ?? meta?.sessionTtlSeconds);

  return (
    <div className="chat-shell">
      <header className="chat-topbar">
        <div className="topbar-left">
          <button type="button" className="icon-btn" onClick={onHome} aria-label="Back to home" title="Home">
            <ArrowLeft />
          </button>
          <button type="button" className="logo-btn" onClick={onHome} aria-label="Dispatch home">
            <Logo size={26} />
          </button>
        </div>
        <div className="topbar-center">
          {sessionId && hasMessages && (
            <span className="session-pill" title="Your conversation is saved on this device's session">
              <span className="pulse" aria-hidden="true" />
              Session saved{expiry ? ` · clears after ${expiry} idle` : ""}
            </span>
          )}
        </div>
        <div className="topbar-right">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button type="button" className="btn btn-sm btn-outline" onClick={newChat} disabled={!hasMessages && !sessionId}>
            <Plus size={16} />
            <span className="hide-xs">New chat</span>
          </button>
        </div>
      </header>

      <main className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="chat-column">
          {isRestoring && !hasMessages ? (
            <RestoringSkeleton />
          ) : hasMessages ? (
            <div className="messages">
              {messages.map((m) => (
                <Message key={m.id} message={m} onRetry={retry} />
              ))}
            </div>
          ) : (
            <EmptyState meta={meta} onPick={handleSend} />
          )}
        </div>
      </main>

      <div className="chat-bottom">
        {showJump && (
          <button
            type="button"
            className="jump-btn"
            onClick={() => {
              stickRef.current = true;
              scrollToBottom("smooth");
            }}
          >
            <ArrowDown size={15} /> Latest
          </button>
        )}
        <Composer ref={composerRef} onSend={handleSend} onStop={stop} isStreaming={isStreaming} disabled={isRestoring} />
      </div>
    </div>
  );
}
