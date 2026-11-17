import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, deleteSession, getHistory, streamChat } from "../lib/api.js";
import { storage } from "../lib/storage.js";

const SESSION_KEY = "dispatch.sessionId";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function friendlyError(err) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return "Can't reach the Dispatch server. Check your connection and try again.";
  return err?.message || "Something went wrong. Please try again.";
}

/**
 * Chat state: messages, streaming, session persistence (localStorage) and
 * history restore from the server.
 */
export function useChat() {
  const [sessionId, setSessionId] = useState(() => storage.get(SESSION_KEY));
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRestoring, setIsRestoring] = useState(() => Boolean(storage.get(SESSION_KEY)));
  const [ttlSeconds, setTtlSeconds] = useState(null);

  const sessionRef = useRef(sessionId);
  const abortRef = useRef(null);
  const busyRef = useRef(false);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const rememberSession = useCallback((id) => {
    sessionRef.current = id;
    setSessionId(id);
    storage.set(SESSION_KEY, id);
  }, []);

  // Restore the previous conversation, if any.
  useEffect(() => {
    const id = sessionRef.current;
    if (!id) return undefined;
    const ctrl = new AbortController();
    getHistory(id, ctrl.signal)
      .then((data) => {
        setTtlSeconds(data.ttlSeconds);
        const restored = data.messages.map((m) => ({ ...m, status: m.stopped ? "stopped" : "done" }));
        // Prepend: the user may already have sent something while this loaded.
        setMessages((prev) => [...restored, ...prev.filter((p) => !restored.some((r) => r.id === p.id))]);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof ApiError && err.status === 400) rememberSession(null);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsRestoring(false);
      });
    return () => ctrl.abort();
  }, [rememberSession]);

  const patch = useCallback((id, update) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...(typeof update === "function" ? update(m) : update) } : m))
    );
  }, []);

  const send = useCallback(
    async (raw) => {
      const query = raw?.trim();
      if (!query || busyRef.current) return false;
      busyRef.current = true;
      setIsStreaming(true);

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: query, createdAt: new Date().toISOString() },
        { id: assistantId, role: "assistant", content: "", sources: null, status: "pending", query },
      ]);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        await streamChat({
          query,
          sessionId: sessionRef.current,
          signal: ctrl.signal,
          onEvent: ({ event, data }) => {
            if (event === "session") {
              if (data.sessionId !== sessionRef.current) rememberSession(data.sessionId);
            } else if (event === "sources") {
              patch(assistantId, { sources: data.sources });
            } else if (event === "token") {
              patch(assistantId, (m) => ({ content: m.content + data.text, status: "streaming" }));
            } else if (event === "done") {
              patch(assistantId, { status: "done", serverId: data.messageId });
            } else if (event === "error") {
              throw new ApiError(data.message, 502);
            }
          },
        });
        // Stream closed without a done event (e.g. proxy cut it).
        patch(assistantId, (m) =>
          m.status === "done" ? {} : m.content ? { status: "done" } : { status: "error", error: "The answer was interrupted. Please try again." }
        );
      } catch (err) {
        if (ctrl.signal.aborted) patch(assistantId, { status: "stopped" });
        else patch(assistantId, { status: "error", error: friendlyError(err) });
      } finally {
        busyRef.current = false;
        abortRef.current = null;
        setIsStreaming(false);
      }
      return true;
    },
    [patch, rememberSession]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** Removes a failed exchange and asks the same question again. */
  const retry = useCallback(
    (assistantId) => {
      const failed = messagesRef.current.find((m) => m.id === assistantId);
      if (!failed?.query || busyRef.current) return;
      setMessages((prev) => {
        const i = prev.findIndex((m) => m.id === assistantId);
        if (i === -1) return prev;
        const start = prev[i - 1]?.role === "user" ? i - 1 : i;
        return [...prev.slice(0, start), ...prev.slice(i + 1)];
      });
      send(failed.query);
    },
    [send]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    const id = sessionRef.current;
    if (id) deleteSession(id).catch(() => {});
    rememberSession(null);
    setMessages([]);
    setTtlSeconds(null);
  }, [rememberSession]);

  return { sessionId, messages, isStreaming, isRestoring, ttlSeconds, send, stop, retry, reset };
}
