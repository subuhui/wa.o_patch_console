import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppConfigStore } from '@/stores/app-config'

describe('useAppConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('toggles sidebar collapse state', () => {
    const store = useAppConfigStore()
    expect(store.isCollapse).toBe(false)

    store.toggleSidebar()
    expect(store.isCollapse).toBe(true)

    store.toggleSidebar()
    expect(store.isCollapse).toBe(false)
  })
})
