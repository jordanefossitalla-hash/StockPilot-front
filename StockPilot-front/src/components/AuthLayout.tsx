import { ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import appLogo from "../assets/stockpilot-logo-retained.png"

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-frame">
        <aside className="auth-visual-panel" aria-hidden="true">
          <div className="auth-visual-content">
            <span className="auth-chip">
              <ShieldCheck size={14} />
              Sécurité StockPilot
            </span>
            <h2>Pilotez votre activite commerciale en toute confiance</h2>
            <p>
              Connexion securisee, suivi en temps reel et pilotage intelligent des
              ventes, stocks et dettes.
            </p>
          </div>
          <div className="auth-lottie-wrap">
            <div className="auth-visual-glow" aria-hidden="true" />
            <div className="auth-brand-lockup">
              <div className="auth-brand-mark">
                <img
                  className="auth-brand-visual"
                  src={appLogo}
                  alt="StockPilot"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-card">
            <h1>{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
            {footer ? <div className="auth-footer-links">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
