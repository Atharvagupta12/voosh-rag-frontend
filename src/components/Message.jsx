import { memo, useEffect, useMemo, useState } from "react";
import { citedNumbers, timeAgo } from "../lib/format.js";
import { Alert, Check, Copy, External, Refresh } from "./Icons.jsx";
import { LogoMark } from "./Logo.jsx";
import { Markdown } from "./Markdown.jsx";

function SourceList({ sources }) {
  return (
    <div className="sources">
      <div className="sources-label">Sources</div>
      <ol className="source-list">
        {sources.map((s) => (
          <li key={s.n}>
            <a className="source-card" href={s.url} target="_blank" rel="noopener noreferrer">
              <span className="source-num">{s.n}</span>
              <span className="source-body">
                <span className="source-title">{s.title}</span>
                <span className="source-meta">
                  {s.source}
                  {s.publishedAt && <> · {timeAgo(s.publishedAt)}</>}
                </span>
              </span>
              <External size={15} className="source-ext" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PendingStatus({ sources }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  let label = "Searching the news…";
  if (sources) {
    label = sources.length
      ? `Reading ${sources.length} ${sources.length === 1 ? "article" : "articles"}…`
      : "No close matches. Drafting a reply…";
  }
  return (
    <div className="pending" role="status">
      <span className="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
      {slow && !sources && (
        <span className="pending-hint">Searching is taking longer than usual. Hang on a moment.</span>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const plain = text.replace(/\s?\[\d{1,2}(?:\s*,\s*\d{1,2})*\]/g, "");
  return (
    <button
      type="button"
      className="msg-action"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(plain);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AssistantMessage({ message, onRetry }) {
  const { content, sources, status, error } = message;
  const cited = useMemo(() => {
    if (!sources?.length || status === "pending" || status === "streaming") return [];
    const nums = citedNumbers(content);
    return sources.filter((s) => nums.has(s.n));
  }, [content, sources, status]);

  return (
    <article className={`msg msg-assistant is-${status}`} aria-busy={status === "pending" || status === "streaming"}>
      <div className="msg-avatar" aria-hidden="true">
        <LogoMark size={28} />
      </div>
      <div className="msg-main">
        <div className="msg-name">Dispatch</div>

        {status === "pending" && <PendingStatus sources={sources} />}

        {content && (
          <div className={`prose${status === "streaming" ? " is-streaming" : ""}`}>
            <Markdown text={content} sources={sources} />
          </div>
        )}

        {status === "stopped" && (
          <div className="msg-note">{content ? "Stopped" : "Stopped before an answer was written."}</div>
        )}

        {status === "error" && (
          <div className="msg-error" role="alert">
            <Alert size={18} />
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onRetry(message.id)}>
              <Refresh size={15} /> Try again
            </button>
          </div>
        )}

        {cited.length > 0 && <SourceList sources={cited} />}

        {(status === "done" || status === "stopped") && content && (
          <div className="msg-actions">
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </article>
  );
}

export const Message = memo(function Message({ message, onRetry }) {
  if (message.role === "user") {
    return (
      <div className="msg msg-user">
        <div className="bubble">{message.content}</div>
      </div>
    );
  }
  return <AssistantMessage message={message} onRetry={onRetry} />;
});
