import { Plus, ShieldCheck, Trash2, UserCog } from "lucide-react"
import { useMemo, useState } from "react"
import { SettingsSubnav } from "../components/SettingsSubnav"

type AppUser = {
  id: string
  fullName: string
  email: string
  role: "admin" | "manager" | "viewer"
  status: "active" | "inactive"
}

const seedUsers: AppUser[] = [
  {
    id: "USR-001",
    fullName: "Admin StockPilot",
    email: "admin@stockpilot.ci",
    role: "admin",
    status: "active",
  },
  {
    id: "USR-002",
    fullName: "Manager Boutique",
    email: "manager@stockpilot.ci",
    role: "manager",
    status: "active",
  },
]

export function SettingsUsersPage() {
  const [users, setUsers] = useState(seedUsers)
  const [showInvite, setShowInvite] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "manager" | "viewer">("viewer")

  const activeCount = useMemo(
    () => users.filter((user) => user.status === "active").length,
    [users],
  )

  function toggleStatus(userId: string) {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== userId) {
          return user
        }

        return {
          ...user,
          status: user.status === "active" ? "inactive" : "active",
        }
      }),
    )
  }

  function removeUser(userId: string) {
    setUsers((current) => current.filter((user) => user.id !== userId))
  }

  function addUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!fullName.trim() || !email.trim()) {
      return
    }

    setUsers((current) => [
      {
        id: `USR-${String(Date.now()).slice(-4)}`,
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        status: "active",
      },
      ...current,
    ])

    setFullName("")
    setEmail("")
    setRole("viewer")
    setShowInvite(false)
  }

  return (
    <section className="page clients-page settings-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Gestion utilisateurs</h2>
          <p className="page-subtitle">Administration des acces de la boutique.</p>
        </div>
      </div>

      <SettingsSubnav />

      <div className="settings-users-summary">
        <article className="stat-card">
          <span>Total utilisateurs</span>
          <strong>{users.length}</strong>
        </article>
        <article className="stat-card">
          <span>Actifs</span>
          <strong>{activeCount}</strong>
        </article>
      </div>

      <div className="clients-actions settings-users-actions">
        <button type="button" className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <Plus size={16} />
          Ajouter utilisateur
        </button>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Role</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="client-main-cell">
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                  </div>
                </td>
                <td>
                  <span className="status-chip status-active">{user.role}</span>
                </td>
                <td>
                  <span
                    className={`status-chip ${
                      user.status === "active" ? "status-active" : "status-blocked"
                    }`}
                  >
                    {user.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td>
                  <div className="table-actions-icons">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => toggleStatus(user.id)}
                      aria-label={`Changer statut ${user.fullName}`}
                    >
                      <UserCog size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      onClick={() => removeUser(user.id)}
                      aria-label={`Supprimer ${user.fullName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {users.map((user) => (
          <article key={user.id} className="client-mobile-card">
            <div className="client-mobile-head">
              <div>
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
              </div>
              <span
                className={`status-chip ${
                  user.status === "active" ? "status-active" : "status-blocked"
                }`}
              >
                {user.status === "active" ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="client-mobile-grid">
              <p>
                <span>Role</span>
                <strong>{user.role}</strong>
              </p>
            </div>

            <div className="table-actions-icons">
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => toggleStatus(user.id)}
                aria-label={`Changer statut ${user.fullName}`}
              >
                <UserCog size={15} />
              </button>
              <button
                type="button"
                className="icon-action-btn danger"
                onClick={() => removeUser(user.id)}
                aria-label={`Supprimer ${user.fullName}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {showInvite ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowInvite(false)}>
          <article
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Ajouter un utilisateur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Ajouter utilisateur</h3>
            </div>

            <form className="client-form-grid" onSubmit={addUser}>
              <label className="field-block field-block-full">
                <span>Nom complet</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>

              <label className="field-block field-block-full">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="field-block field-block-full">
                <span>Role</span>
                <select value={role} onChange={(event) => setRole(event.target.value as "admin" | "manager" | "viewer")}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Lecteur</option>
                </select>
              </label>

              <div className="client-form-actions supplier-payment-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <ShieldCheck size={16} />
                  Créer utilisateur
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  )
}
