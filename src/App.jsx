import { useCallback, useEffect, useRef, useState } from "react";
import { Chat } from "./components/Chat.jsx";
import { Landing } from "./components/Landing.jsx";
import { useMeta } from "./hooks/useMeta.js";
import { useTheme } from "./hooks/useTheme.js";

const CHAT_HASH = "#/chat";
const currentView = () => (window.location.hash.startsWith(CHAT_HASH) ? "chat" : "landing");

export default function App() {
  const [view, setView] = useState(currentView);
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const { theme, toggle } = useTheme();
  const { meta, loading, error } = useMeta();

  useEffect(() => {
    const onHash = () => setView(currentView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title = view === "chat" ? "Chat · Dispatch" : "Dispatch: Ask the news";
    if (view === "chat") window.scrollTo(0, 0);
  }, [view]);

  const cameFromLanding = useRef(false);

  const openChat = useCallback((prompt) => {
    setPendingPrompt(typeof prompt === "string" ? prompt : null);
    cameFromLanding.current = true;
    window.location.hash = CHAT_HASH;
  }, []);

  const goHome = useCallback(() => {
    // Going back keeps the browser history tidy when the chat was opened from the landing page.
    if (cameFromLanding.current) {
      cameFromLanding.current = false;
      window.history.back();
      return;
    }
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    setView("landing");
  }, []);

  const clearPrompt = useCallback(() => setPendingPrompt(null), []);

  return view === "chat" ? (
    <Chat
      meta={meta}
      theme={theme}
      onToggleTheme={toggle}
      onHome={goHome}
      initialPrompt={pendingPrompt}
      onInitialPromptUsed={clearPrompt}
    />
  ) : (
    <Landing
      meta={meta}
      metaLoading={loading}
      metaError={error}
      theme={theme}
      onToggleTheme={toggle}
      onOpenChat={openChat}
    />
  );
}
