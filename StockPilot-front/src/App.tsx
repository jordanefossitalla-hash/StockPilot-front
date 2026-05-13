import { useEffect, useRef } from "react"
import { AppRouter } from "./routes/AppRouter"
import { useAuthStore } from "./store/authStore"

function App() {
  const initializeSession = useAuthStore((state) => state.initializeSession)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true
    void initializeSession()
  }, [initializeSession])

  return <AppRouter />
}

export default App
