import { useEffect, useMemo, useState } from "react"
import type { ThemeMode } from "../types/theme"

const STORAGE_KEY = "stockpilot-theme"

function getInitialTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(STORAGE_KEY)
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useMemo(
    () => () => setTheme((current) => (current === "light" ? "dark" : "light")),
    [],
  )

  return {
    theme,
    toggleTheme,
  }
}
