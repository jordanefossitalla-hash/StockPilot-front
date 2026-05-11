import { ImagePlus, Save, Store } from "lucide-react"
import { useMemo, useState } from "react"
import { SettingsSubnav } from "../components/SettingsSubnav"

type ShopSettingsForm = {
  shopName: string
  currency: "XOF" | "EUR" | "USD"
  phone: string
  logoUrl: string
}

const STORAGE_KEY = "sp-shop-settings"

function loadShopSettings(): ShopSettingsForm {
  if (typeof window === "undefined") {
    return {
      shopName: "StockPilot Boutique",
      currency: "XOF",
      phone: "+2250700000000",
      logoUrl: "",
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {
      shopName: "StockPilot Boutique",
      currency: "XOF",
      phone: "+2250700000000",
      logoUrl: "",
    }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ShopSettingsForm>

    return {
      shopName: parsed.shopName ?? "StockPilot Boutique",
      currency: parsed.currency === "EUR" || parsed.currency === "USD" ? parsed.currency : "XOF",
      phone: parsed.phone ?? "+2250700000000",
      logoUrl: parsed.logoUrl ?? "",
    }
  } catch {
    return {
      shopName: "StockPilot Boutique",
      currency: "XOF",
      phone: "+2250700000000",
      logoUrl: "",
    }
  }
}

export function SettingsShopPage() {
  const initial = useMemo(() => loadShopSettings(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shopName, setShopName] = useState(initial.shopName)
  const [currency, setCurrency] = useState<"XOF" | "EUR" | "USD">(initial.currency)
  const [phone, setPhone] = useState(initial.phone)
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl)
  const [logoPreview, setLogoPreview] = useState(initial.logoUrl)

  function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setLogoPreview(objectUrl)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const payload: ShopSettingsForm = {
      shopName,
      currency,
      phone,
      logoUrl,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }

    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsSubmitting(false)
  }

  return (
    <section className="page clients-page settings-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Parametres boutique</h2>
          <p className="page-subtitle">Configuration globale de la boutique.</p>
        </div>
      </div>

      <SettingsSubnav />

      <div className="settings-layout-grid">
        <article className="settings-profile-card">
          <div className="settings-avatar-badge">
            <Store size={28} />
          </div>
          <h3>{shopName}</h3>
          <p>{currency}</p>
          <small>{phone}</small>

          {logoPreview ? (
            <img className="settings-logo-preview" src={logoPreview} alt="Logo boutique" />
          ) : (
            <div className="settings-logo-placeholder">
              <ImagePlus size={18} />
              <span>Aucun logo</span>
            </div>
          )}
        </article>

        <form className="client-form-card" onSubmit={handleSubmit}>
          <div className="client-form-grid">
            <label className="field-block field-block-full">
              <span>Nom boutique</span>
              <input value={shopName} onChange={(event) => setShopName(event.target.value)} />
            </label>

            <label className="field-block">
              <span>Devise</span>
              <select value={currency} onChange={(event) => setCurrency(event.target.value as "XOF" | "EUR" | "USD")}>
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </label>

            <label className="field-block">
              <span>Telephone boutique</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>

            <label className="field-block field-block-full">
              <span>URL logo</span>
              <input
                type="url"
                placeholder="https://..."
                value={logoUrl}
                onChange={(event) => {
                  setLogoUrl(event.target.value)
                  setLogoPreview(event.target.value)
                }}
              />
            </label>

            <label className="field-block field-block-full">
              <span>Ou televerser un logo</span>
              <input type="file" accept="image/*" onChange={handleLogoSelect} />
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
