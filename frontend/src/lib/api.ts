const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8099/api'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshPromise: Promise<boolean> | null = null
let refreshTimeout: ReturnType<typeof setTimeout> | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
  scheduleTokenRefresh(access)
}

export function loadTokens() {
  accessToken = localStorage.getItem('accessToken')
  refreshToken = localStorage.getItem('refreshToken')
  if (accessToken) {
    scheduleTokenRefresh(accessToken)
  }
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  refreshPromise = null
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export function getAccessToken() {
  return accessToken
}

function decodeJwt(token: string): { exp?: number } | null {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64 || ''))
  } catch {
    return null
  }
}

function scheduleTokenRefresh(token: string) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
  const payload = decodeJwt(token)
  if (!payload?.exp) return

  const expiresIn = payload.exp * 1000 - Date.now()
  const refreshIn = expiresIn - 60_000
  if (refreshIn <= 0) return

  refreshTimeout = setTimeout(async () => {
    refreshPromise = null
    const ok = await refreshAccessToken()
    if (!ok) {
      handleAuthFailure()
    }
  }, refreshIn)
}

function handleAuthFailure() {
  clearTokens()
  window.location.href = '/login'
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false

  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (!res.ok) {
        refreshPromise = null
        return false
      }
      const data = await res.json()
      accessToken = data.access
      localStorage.setItem('accessToken', data.access)
      scheduleTokenRefresh(data.access)
      refreshPromise = null
      return true
    } catch {
      refreshPromise = null
      return false
    }
  })()

  return refreshPromise
}

async function doFetch(url: string, options: RequestInit) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  return fetch(url, { ...options, headers })
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  loadTokens()

  let res = await doFetch(`${API_URL}${path}`, options)

  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      res = await doFetch(`${API_URL}${path}`, options)
    } else {
      handleAuthFailure()
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.')
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error de red' }))
    throw new Error(error.error || error.detail || JSON.stringify(error))
  }

  return res.json()
}
