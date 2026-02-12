import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "rr-theme";

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
