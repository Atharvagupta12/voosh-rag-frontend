import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Stop } from "./Icons.jsx";

const MAX_CHARS = 1000;

export const Composer = forwardRef(function Composer({ onSend, onStop, isStreaming, disabled }, ref) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }), []);

  // Auto-grow up to a max height.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  const submit = async () => {
    if (!canSend) return;
    const text = value;
    setValue("");
    const accepted = await onSend(text);
    if (accepted === false) setValue(text);
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={`composer-box${disabled ? " is-disabled" : ""}`}>
        <label htmlFor="composer-input" className="sr-only">
          Ask about the news
        </label>
        <textarea
          id="composer-input"
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={MAX_CHARS}
          placeholder="Ask about today's news…"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="send"
        />
        {isStreaming ? (
          <button type="button" className="send-btn is-stop" onClick={onStop} aria-label="Stop generating" title="Stop generating">
            <Stop size={16} />
          </button>
        ) : (
          <button type="submit" className="send-btn" disabled={!canSend} aria-label="Send" title="Send (Enter)">
            <ArrowUp size={18} />
          </button>
        )}
      </div>
      <p className="composer-note">
        {value.length > MAX_CHARS * 0.8 ? (
          <span className="char-count">
            {value.length}/{MAX_CHARS}
          </span>
        ) : (
          <>Answers come only from indexed articles and can contain mistakes. Check the sources.</>
        )}
      </p>
    </form>
  );
});
