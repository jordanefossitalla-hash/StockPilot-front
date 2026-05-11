import { Save, UserRound } from "lucide-react"
import { useState } from "react"
import { SettingsSubnav } from "../components/SettingsSubnav"
import { useAuthStore } from "../store/authStore"

export function SettingsProfilePage() {
  const user = useAuthStore((state) => state.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [role] = useState(user?.role ?? "Utilisateur")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    setIsSubmitting(false)
  }

  return (
    <section className="page clients-page settings-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Profil utilisateur</h2>
          <p className="page-subtitle">Informations personnelles du compte connecte.</p>
        </div>
      </div>

      <SettingsSubnav />

      <div className="settings-layout-grid">
        <article className="settings-profile-card">
          <div className="settings-avatar-badge">
            <UserRound size={28} />
          </div>
          <h3>{name || "Utilisateur"}</h3>
          <p>{role}</p>
          <small>{email || "Aucun email"}</small>
        </article>

        <form className="client-form-card" onSubmit={handleSubmit}>
          <div className="client-form-grid">
            <label className="field-block">
              <span>Nom complet</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            <label className="field-block">
              <span>Role</span>
              <input value={role} disabled />
            </label>

            <label className="field-block">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="field-block">
              <span>Telephone</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>

          <div className="client-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
