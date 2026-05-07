import { Menu, MoonStar, Sun, X } from "lucide-react"
import type { ThemeMode } from "../types/theme"

type AppHeaderProps = {
  title: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  theme: ThemeMode
  onToggleTheme: () => void
  userInitials: string
}

export function AppHeader({
  title,
  sidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
  userInitials,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-start">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-end">
        <button
          type="button"
          className="icon-btn"
          aria-label="Changer le thème"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Sun size={16} /> : <MoonStar size={16} />}
        </button>
        <button
          type="button"
          className="header-avatar"
          aria-label="Menu utilisateur"
        >
          {userInitials}
        </button>
      </div>
    </header>
  )
}
