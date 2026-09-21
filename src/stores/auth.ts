import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('shorebird_token'))
  const currentAppId = ref<string | null>(localStorage.getItem('shorebird_current_app_id'))

  const isAuthenticated = computed(() => Boolean(token.value && token.value.trim().length > 0))

  function setToken(newToken: string) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('shorebird_token', newToken)
    } else {
      localStorage.removeItem('shorebird_token')
    }
  }

  function setCurrentAppId(appId: string | null) {
    currentAppId.value = appId
    if (appId) {
      localStorage.setItem('shorebird_current_app_id', appId)
    } else {
      localStorage.removeItem('shorebird_current_app_id')
    }
  }

  function logout() {
    setToken('')
    setCurrentAppId(null)
  }

  return {
    token,
    currentAppId,
    isAuthenticated,
    setToken,
    setCurrentAppId,
    logout,
  }
})
