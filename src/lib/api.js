const RAW_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
export const API_URL = RAW_URL.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function errorFrom(res) {
  let message;
  try {
    message = (await res.json()).error;
  } catch {
    /* non-JSON error body */
  }
  if (!message && res.status === 429) message = "You're sending messages too quickly. Please wait a moment.";
  return new ApiError(message || `Request failed (${res.status})`, res.status);
}

async function request(path, init) {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw await errorFrom(res);
  return res.json();
}

export const getMeta = (signal) => request("/meta", { signal });
export const getHistory = (sessionId, signal) => request(`/sessions/${sessionId}/messages`, { signal });
export const deleteSession = (sessionId) => request(`/sessions/${sessionId}`, { method: "DELETE" });

function parseEvent(block) {
  let event = "message";
  const data = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
  }
  if (!data.length) return null; // comments / heartbeats
  return { event, data: JSON.parse(data.join("\n")) };
}

/**
 * POSTs a question and reads the server-sent event stream.
 * Calls onEvent({ event, data }) for session, sources, token, done and error events.
 */
export async function streamChat({ query, sessionId, signal, onEvent }) {
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ query, sessionId }),
    signal,
  });
  if (!res.ok || !res.body) throw await errorFrom(res);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  const boundary = /\r?\n\r?\n/;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let match;
    while ((match = boundary.exec(buffer))) {
      const evt = parseEvent(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
      if (evt) onEvent(evt);
    }
  }
}
