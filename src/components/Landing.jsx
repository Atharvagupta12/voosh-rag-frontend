import { timeAgo } from "../lib/format.js";
import { ArrowRight, Clock, Layers, Quote, Rss, Search, Sparkle } from "./Icons.jsx";
import { Logo, LogoMark } from "./Logo.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

function HeroPreview({ headlines }) {
  const a = headlines?.[0];
  const b = headlines?.[1];
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-card">
        <div className="preview-bar">
          <span className="preview-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="preview-title">Dispatch</span>
        </div>
        <div className="preview-body">
          <div className="preview-user">{a ? `What's the story behind “${shorten(a.title, 52)}”?` : "What happened in the news today?"}</div>
          <div className="preview-answer">
            <LogoMark size={22} />
            <div className="preview-lines">
              <span className="line w-95" />
              <span className="line w-80">
                <b className="chip">1</b>
              </span>
              <span className="line w-90" />
              <span className="line w-60">
                <b className="chip">2</b>
              </span>
            </div>
          </div>
          <div className="preview-sources">
            {[a, b].map((h, i) => (
              <div className="preview-source" key={i}>
                <span className="preview-num">{i + 1}</span>
                <span className="preview-src-text">
                  <span className="t">{h ? shorten(h.title, 54) : i ? "Second source article" : "Source article headline"}</span>
                  <span className="m">{h ? `${h.source} · ${timeAgo(h.publishedAt)}` : "Newsroom · today"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="preview-glow" />
    </div>
  );
}

function shorten(s, n) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

function Ticker({ headlines }) {
  if (!headlines?.length) return null;
  const items = headlines.slice(0, 10);
  const row = items.map((h, i) => (
    <span className="ticker-item" key={i}>
      <span className="ticker-src">{h.source}</span>
      {h.title}
    </span>
  ));
  return (
    <div className="ticker" aria-label="Latest headlines">
      <div className="ticker-label">
        <span className="pulse" aria-hidden="true" /> On the wire
      </div>
      <div className="ticker-viewport">
        <div className="ticker-track">
          {row}
          <span aria-hidden="true" className="ticker-dup">
            {row}
          </span>
        </div>
      </div>
    </div>
  );
}

function Coverage({ meta, loading, error, onAsk }) {
  return (
    <section id="coverage" className="section container">
      <div className="section-head">
        <span className="eyebrow">Coverage</span>
        <h2>Fresh from the newsroom</h2>
        <p>
          A selection of the stories Dispatch has read. Pick one to start a conversation about it.
        </p>
      </div>

      {loading && (
        <div className="cards">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="card card-skeleton" key={i} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="notice">
          Couldn't load the latest coverage. The server may be starting up. You can still open the chat and ask a
          question.
        </div>
      )}

      {meta?.headlines?.length > 0 && (
        <div className="cards">
          {meta.headlines.slice(0, 6).map((h) => (
            <button key={h.url} type="button" className="card" onClick={() => onAsk(`What's the story behind "${h.title}"?`)}>
              <span className="card-meta">
                <span className="badge">{h.source}</span>
                {h.topic && <span className="card-topic">{h.topic}</span>}
                <span className="card-time">{timeAgo(h.publishedAt)}</span>
              </span>
              <span className="card-title">{h.title}</span>
              <span className="card-cta">
                Ask about this <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const STEPS = [
  {
    icon: Rss,
    title: "It reads the news",
    body: "Articles from major newsrooms are collected from their public feeds, cleaned of clutter and split into short passages.",
  },
  {
    icon: Search,
    title: "It finds what matters",
    body: "Your question is turned into an embedding and matched against every passage in a vector index, by meaning rather than keywords.",
  },
  {
    icon: Quote,
    title: "It answers, with receipts",
    body: "A language model writes a concise answer using only those passages and cites each one. If the coverage doesn't say, neither does Dispatch.",
  },
];

const FEATURES = [
  { icon: Quote, title: "Every claim cited", body: "Numbered citations link straight to the original article." },
  { icon: Layers, title: "Follows the thread", body: "Ask follow-ups. Dispatch remembers what you were talking about." },
  { icon: Clock, title: "Private, short-lived sessions", body: "No sign-up. Conversations clear themselves after a day of inactivity." },
  { icon: Sparkle, title: "Streams as it writes", body: "Answers appear word by word, and you can stop them at any time." },
];

export function Landing({ meta, metaLoading, metaError, theme, onToggleTheme, onOpenChat }) {
  const stats = meta?.articleCount
    ? [
        { value: meta.articleCount, label: "articles indexed" },
        { value: meta.sources.length, label: "newsrooms" },
        { value: meta.latestPublishedAt ? timeAgo(meta.latestPublishedAt) : "today", label: "latest story" },
      ]
    : null;

  return (
    <div className="landing">
      <header className="nav">
        <div className="nav-inner container">
          <a href="#top" className="nav-logo" aria-label="Dispatch home">
            <Logo />
          </a>
          <nav className="nav-links" aria-label="Sections">
            <a href="#coverage">Coverage</a>
            <a href="#how">How it works</a>
          </nav>
          <div className="nav-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button type="button" className="btn btn-sm btn-primary" onClick={() => onOpenChat()}>
              Open chat
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-live">
              <span className="pulse" aria-hidden="true" />
              {meta?.articleCount
                ? `${meta.articleCount} stories from ${meta.sources.length} newsrooms`
                : "A news assistant you can check"}
            </span>
            <h1 className="hero-title">
              Ask the news.
              <br />
              <em>Get answers with receipts.</em>
            </h1>
            <p className="hero-lede">
              Dispatch reads current reporting so you can ask about it in plain language. You get a short answer with
              every claim linked to the article it came from.
            </p>
            <div className="hero-ctas">
              <button type="button" className="btn btn-lg btn-primary" onClick={() => onOpenChat()}>
                Start asking <ArrowRight size={18} />
              </button>
              <a href="#how" className="btn btn-lg btn-ghost">
                How it works
              </a>
            </div>
            {stats && (
              <dl className="stats">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <HeroPreview headlines={meta?.headlines} />
        </section>

        <Ticker headlines={meta?.headlines} />

        <Coverage meta={meta} loading={metaLoading} error={metaError} onAsk={onOpenChat} />

        <section id="how" className="section container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Retrieval first, then the answer</h2>
            <p>Dispatch is a retrieval-augmented generation (RAG) pipeline. The model only sees what the search finds.</p>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <li className="step" key={step.title}>
                  <span className="step-num">0{i + 1}</span>
                  <span className="step-icon">
                    <StepIcon size={20} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              );
            })}
          </ol>
          <ul className="features">
            {FEATURES.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <li key={feature.title}>
                  <FeatureIcon size={18} />
                  <div>
                    <strong>{feature.title}</strong>
                    <span>{feature.body}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="container">
          <div className="cta-band">
            <h2>
              Your briefing is <em>one question away.</em>
            </h2>
            <button type="button" className="btn btn-lg btn-inverse" onClick={() => onOpenChat()}>
              Start asking <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer className="footer container">
        <Logo size={22} />
        <p>
          A retrieval-augmented news assistant. Built with Jina embeddings, Qdrant, Gemini and Redis.
          {meta?.sources?.length ? ` Sources: ${meta.sources.join(", ")}.` : ""}
        </p>
      </footer>
    </div>
  );
}
