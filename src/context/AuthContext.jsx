import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiRequest } from '../services/api'

const AuthContext = createContext(null)

// Default local admin identity so offline work & local financial data are NEVER wiped or stranded
const DEFAULT_LOCAL_ADMIN = {
  id: '6acbee9eb19661efbca3488b',
  name: 'Admin',
  email: 'admin@perfin.app',
  role: 'admin',
  isActive: true,
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('finper_auth_token'))
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem('finper_auth_token')
    const storedUser = localStorage.getItem('finper_current_user')
    if (storedToken && storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch {
        return null
      }
    }
    return null
  })

  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [needsSetup, setNeedsSetup] = useState(false)

  // Verify online auth if backend is reachable
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('finper_auth_token')
    if (!storedToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const profileRes = await apiRequest('/auth/me')
      if (profileRes?.user) {
        setUser(profileRes.user)
        localStorage.setItem('finper_current_user', JSON.stringify(profileRes.user))
      }
    } catch (err) {
      console.warn('[AuthContext] Verification failed:', err.message)
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('finper_auth_token')
        localStorage.removeItem('finper_current_user')
        setToken(null)
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem('finper_auth_token', data.token)
      localStorage.setItem('finper_current_user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      setNeedsSetup(false)
      return data.user
    } catch (err) {
      // If backend is offline but admin credentials are used, allow local admin entry
      if (
        email.toLowerCase() === 'admin@perfin.app' &&
        password === 'adminpassword123'
      ) {
        setUser(DEFAULT_LOCAL_ADMIN)
        localStorage.setItem('finper_current_user', JSON.stringify(DEFAULT_LOCAL_ADMIN))
        return DEFAULT_LOCAL_ADMIN
      }
      throw err
    }
  }, [])

  const register = useCallback(async ({ name, email, password, invitationToken }) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, invitationToken }),
    })

    localStorage.setItem('finper_auth_token', data.token)
    localStorage.setItem('finper_current_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    setNeedsSetup(false)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('finper_auth_token')
    localStorage.removeItem('finper_current_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        isLoading,
        needsSetup,
        login,
        register,
        logout,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
