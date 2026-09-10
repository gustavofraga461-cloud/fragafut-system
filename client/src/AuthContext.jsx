import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = getToken()
    if (!t) { setReady(true); return }
    api('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true))
  }, [])

  const login = async (loginId, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: loginId, password }) })
    setToken(d.token)
    setUser(d.user)
    return d.user
  }

  const logout = () => { setToken(null); setUser(null) }

  const canManage = user && (user.role === 'admin' || user.role === 'organizer')
  const isAdmin = user && user.role === 'admin'

  return (
    <Ctx.Provider value={{ user, ready, login, logout, canManage, isAdmin }}>
      {children}
    </Ctx.Provider>
  )
}
