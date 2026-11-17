import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { linkCitations } from "../lib/format.js";

const remarkPlugins = [remarkGfm];

/** Renders an answer as Markdown, turning [n] markers into citation chips that link to the source. */
export const Markdown = memo(function Markdown({ text, sources }) {
  const byNumber = useMemo(() => new Map((sources ?? []).map((s) => [s.n, s])), [sources]);
  const prepared = useMemo(() => linkCitations(text, new Set(byNumber.keys())), [text, byNumber]);

  const components = useMemo(
    () => ({
      a({ href, children }) {
        if (href?.startsWith("#cite-")) {
          const source = byNumber.get(Number(href.slice(6)));
          return (
            <a
              className="cite"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${source.title} (${source.source})`}
              aria-label={`Source ${source.n}: ${source.title}`}
            >
              {children}
            </a>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },
    }),
    [byNumber]
  );

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {prepared}
    </ReactMarkdown>
  );
});
