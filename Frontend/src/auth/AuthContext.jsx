import { useEffect, useMemo, useState } from 'react'
import { authApi, clearToken, getToken, saveToken, usersApi } from '../api'
import AuthContext from './context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('sweety:unauthorized', handleUnauthorized)

    if (!getToken()) {
      return () => window.removeEventListener('sweety:unauthorized', handleUnauthorized)
    }

    authApi.me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((error) => {
        if (error.status === 401) {
          clearToken()
          setUser(null)
          setAuthError('')
          return
        }
        setAuthError(error.message)
      })
      .finally(() => setLoading(false))

    return () => window.removeEventListener('sweety:unauthorized', handleUnauthorized)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    async signIn(credentials) {
      const result = await authApi.login(credentials)
      saveToken(result.token)
      setUser(result.user)
      setAuthError('')
      return result.user
    },
    async register(details) {
      const result = await authApi.register(details)
      saveToken(result.token)
      setUser(result.user)
      setAuthError('')
      return result.user
    },
    async updateUser(details) {
      const result = await usersApi.updateProfile(details)
      setUser(result.user)
      return result.user
    },
    signOut() {
      clearToken()
      setUser(null)
      setAuthError('')
    },
  }), [authError, loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
