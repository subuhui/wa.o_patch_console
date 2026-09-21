import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initializes with unauthenticated state when localStorage is empty', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBeNull()
  })

  it('updates token and persists to localStorage', () => {
    const auth = useAuthStore()
    auth.setToken('test_secret_token')

    expect(auth.token).toBe('test_secret_token')
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('shorebird_token')).toBe('test_secret_token')
  })

  it('clears state on logout', () => {
    const auth = useAuthStore()
    auth.setToken('token_123')
    auth.setCurrentAppId('app_123')

    auth.logout()

    expect(auth.token).toBe('')
    expect(auth.currentAppId).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('shorebird_token')).toBeNull()
    expect(localStorage.getItem('shorebird_current_app_id')).toBeNull()
  })
})
