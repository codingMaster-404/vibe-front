import axios from 'axios'
import { VIBEFRONT_ADMIN_TOKEN_KEY, VIBEFRONT_AUTH_FLAG_KEY, VIBEFRONT_USER_ID_KEY } from './constants/storageKeys'

const api = axios.create({
  // 개발: Vite 프록시(/api → 8081)로 동일 출처 요청 → 404(정적 리소스) 혼동 방지
  baseURL: import.meta.env.DEV ? '' : 'http://localhost:8081',
  withCredentials: true,
})

function requestPath(config) {
  const raw = config.url || ''
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname
    } catch {
      return raw.split('?')[0]
    }
  }
  const base = (config.baseURL || '').replace(/\/+$/, '')
  const u = raw.startsWith('/') ? raw : `/${raw}`
  if (!base || base === '') return u.split('?')[0]
  try {
    return new URL(u, base).pathname
  } catch {
    return u.split('?')[0]
  }
}

function isAdminProtectedPath(pathname) {
  return pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth/')
}

/** 매 요청마다 localStorage에서 최신 토큰을 읽어 헤더에 설정 */
api.interceptors.request.use((config) => {
  const pathname = requestPath(config)
  if (!isAdminProtectedPath(pathname)) {
    return config
  }
  const headers = (config.headers = config.headers ?? {})
  try {
    const token = localStorage.getItem(VIBEFRONT_ADMIN_TOKEN_KEY)
    if (token && String(token).trim()) {
      headers.Authorization = `Bearer ${String(token).trim()}`
    } else {
      delete headers.Authorization
    }
  } catch {
    /* ignore */
  }
  return config
})

let adminAuthRedirectScheduled = false

function clearStoredSessionForAdminRelogin() {
  try {
    localStorage.removeItem(VIBEFRONT_ADMIN_TOKEN_KEY)
    localStorage.removeItem(VIBEFRONT_AUTH_FLAG_KEY)
    localStorage.removeItem(VIBEFRONT_USER_ID_KEY)
  } catch {
    /* ignore */
  }
}

function redirectToAdminLogin() {
  if (typeof window === 'undefined' || adminAuthRedirectScheduled) return
  if (window.location.pathname === '/admin/auth') return
  adminAuthRedirectScheduled = true
  window.location.replace(`${window.location.origin}/admin/auth`)
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const cfg = error?.config
    if (status === 401 && cfg) {
      const pathname = requestPath(cfg)
      if (isAdminProtectedPath(pathname)) {
        clearStoredSessionForAdminRelogin()
        redirectToAdminLogin()
      }
    }
    return Promise.reject(error)
  },
)

export default api
