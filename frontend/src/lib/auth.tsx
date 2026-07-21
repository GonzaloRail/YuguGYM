import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setTokens, clearTokens, loadTokens, getAccessToken } from './api'

interface User {
  id: number
  usuario: string
  nombres: string
  apellidos: string
  correo: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (correo: string, password: string) => Promise<void>
  register: (data: { usuario: string; nombres: string; apellidos: string; correo: string; password: string; password_confirm: string }) => Promise<void>
  changePassword: (data: { current_password: string; new_password: string; new_password_confirm: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadTokens()
    if (getAccessToken()) {
      fetchUser()
    }
  }, [])

  async function fetchUser() {
    try {
      const data = await api<{ user: User }>('/auth/me/')
      setUser(data.user)
    } catch {
      clearTokens()
    }
  }

  async function login(correo: string, password: string) {
    const data = await api<{ access: string; refresh: string; user: User }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    })
    setTokens(data.access, data.refresh)
    setUser(data.user)
  }

  async function register(regData: { usuario: string; nombres: string; apellidos: string; correo: string; password: string; password_confirm: string }) {
    await api('/auth/register-admin/', {
      method: 'POST',
      body: JSON.stringify(regData),
    })
  }

  async function changePassword(pwData: { current_password: string; new_password: string; new_password_confirm: string }) {
    await api('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(pwData),
    })
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
