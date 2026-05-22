import { useEffect, useRef, useState } from "react"
import { AppRouter } from "./routes/AppRouter"
import {
  getOrderSyncState,
  initOrderOfflineSync,
  ORDER_SYNC_EVENT,
  syncQueuedOrderMutations,
} from "./services/orderService"
import { useAuthStore } from "./store/authStore"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

function App() {
  const initializeSession = useAuthStore((state) => state.initializeSession)
  const initializedRef = useRef(false)
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [isOffline, setIsOffline] = useState(
    typeof window !== "undefined" ? !window.navigator.onLine : false,
  )
  const [isOfflineReady, setIsOfflineReady] = useState(false)
  const [isUpdateReady, setIsUpdateReady] = useState(false)
  const [isInstallAvailable, setIsInstallAvailable] = useState(false)
  const [orderSyncState, setOrderSyncState] = useState(() => getOrderSyncState())

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true
    initOrderOfflineSync()
    void initializeSession()
  }, [initializeSession])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    const handleOfflineReady = () => setIsOfflineReady(true)
    const handleUpdateReady = () => setIsUpdateReady(true)
    const handleOrderSyncState = (event: Event) => {
      const nextState = (event as CustomEvent<ReturnType<typeof getOrderSyncState>>).detail

      if (nextState) {
        setOrderSyncState(nextState)
        return
      }

      setOrderSyncState(getOrderSyncState())
    }
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      installPromptRef.current = event as BeforeInstallPromptEvent
      setIsInstallAvailable(true)
    }
    const handleAppInstalled = () => {
      installPromptRef.current = null
      setIsInstallAvailable(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("stockpilot:pwa-offline-ready", handleOfflineReady)
    window.addEventListener("stockpilot:pwa-update-ready", handleUpdateReady)
    window.addEventListener(ORDER_SYNC_EVENT, handleOrderSyncState as EventListener)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("stockpilot:pwa-offline-ready", handleOfflineReady)
      window.removeEventListener("stockpilot:pwa-update-ready", handleUpdateReady)
      window.removeEventListener(ORDER_SYNC_EVENT, handleOrderSyncState as EventListener)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  function handleApplyUpdate() {
    window.dispatchEvent(new CustomEvent("stockpilot:pwa-apply-update"))
  }

  async function handleInstallApp() {
    const promptEvent = installPromptRef.current
    if (!promptEvent) {
      return
    }

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice

    if (choice.outcome !== "accepted") {
      return
    }

    installPromptRef.current = null
    setIsInstallAvailable(false)
  }

  const hasPendingOfflineOrders = orderSyncState.pendingCount > 0
  const shouldShowOrderSyncBanner =
    hasPendingOfflineOrders || orderSyncState.isSyncing || Boolean(orderSyncState.lastError)

  return (
    <>
      {isOffline || isOfflineReady || isUpdateReady || isInstallAvailable || shouldShowOrderSyncBanner ? (
        <div className="app-status-stack" aria-live="polite" aria-atomic="true">
          {isInstallAvailable ? (
            <div className="app-status-banner is-brand">
              <div>
                <strong>Installer StockPilot</strong>
                <p>Ajoute l'application à l'écran d'accueil pour un accès plus direct et plus fluide.</p>
              </div>
              <div className="app-status-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsInstallAvailable(false)}>
                  Plus tard
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void handleInstallApp()}>
                  Installer
                </button>
              </div>
            </div>
          ) : null}

          {isOffline ? (
            <div className="app-status-banner is-warning">
              <div>
                <strong>Mode hors ligne</strong>
                <p>
                  Les écrans déjà visités restent accessibles. Les données temps réel peuvent être limitées.
                </p>
              </div>
            </div>
          ) : null}

          {shouldShowOrderSyncBanner ? (
            <div className={`app-status-banner${orderSyncState.lastError ? " is-warning" : " is-success"}`}>
              <div>
                <strong>
                  {orderSyncState.isSyncing
                    ? "Synchronisation des commandes en cours"
                    : orderSyncState.lastError
                      ? "Synchronisation des commandes interrompue"
                      : "Commandes en attente de synchronisation"}
                </strong>
                <p>
                  {orderSyncState.lastError
                    ? orderSyncState.lastError
                    : hasPendingOfflineOrders
                      ? `${orderSyncState.pendingCount} commande${orderSyncState.pendingCount > 1 ? "s" : ""} sera${orderSyncState.pendingCount > 1 ? "ont" : ""} resynchronisée${orderSyncState.pendingCount > 1 ? "s" : ""} dès que la connexion est stable.`
                      : "Les commandes hors ligne ont été resynchronisées."}
                </p>
              </div>
              {orderSyncState.isOnline && hasPendingOfflineOrders && !orderSyncState.isSyncing ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void syncQueuedOrderMutations()}
                >
                  Relancer la sync
                </button>
              ) : null}
            </div>
          ) : null}

          {isOfflineReady ? (
            <div className="app-status-banner is-success">
              <div>
                <strong>Application prête hors ligne</strong>
                <p>Le shell applicatif est maintenant disponible même sans connexion.</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setIsOfflineReady(false)}>
                Fermer
              </button>
            </div>
          ) : null}

          {isUpdateReady ? (
            <div className="app-status-banner is-brand">
              <div>
                <strong>Mise à jour disponible</strong>
                <p>Recharge l'application pour activer la dernière version.</p>
              </div>
              <div className="app-status-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsUpdateReady(false)}>
                  Plus tard
                </button>
                <button type="button" className="btn btn-primary" onClick={handleApplyUpdate}>
                  Mettre à jour
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <AppRouter />
    </>
  )
}

export default App
