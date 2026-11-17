import { useCallback, useEffect, useState } from "react";
import { storage } from "../lib/storage.js";

const KEY = "dispatch.theme";
const media = () => window.matchMedia?.("(prefers-color-scheme: dark)");

function resolve(saved) {
  if (saved === "light" || saved === "dark") return saved;
  return media()?.matches ? "dark" : "light";
}

export function useTheme() {
  const [saved, setSaved] = useState(() => storage.get(KEY));
  const [systemDark, setSystemDark] = useState(() => Boolean(media()?.matches));
  const theme = saved === "light" || saved === "dark" ? saved : systemDark ? "dark" : "light";

  useEffect(() => {
    const mq = media();
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
    else delete root.dataset.theme;
  }, [saved]);

  useEffect(() => {
    const color = theme === "dark" ? "#0f0e0c" : "#f7f4ee";
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
  }, [theme]);

  const toggle = useCallback(() => {
    const next = resolve(storage.get(KEY)) === "dark" ? "light" : "dark";
    storage.set(KEY, next);
    setSaved(next);
  }, []);

  return { theme, toggle };
}
