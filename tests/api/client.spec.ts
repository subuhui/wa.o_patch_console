import { describe, it, expect, beforeEach } from 'vitest'
import apiClient from '@/api/client'

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('automatically adds Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('shorebird_token', 'my_bearer_token')

    // Requests through MSW
    const response = await apiClient.get('/users/me')
    expect(response.status).toBe(200)
    expect(response.data.email).toBe('admin@shorebird.local')
  })

  it('fetches apps list correctly via MSW', async () => {
    const response = await apiClient.get('/apps')
    expect(response.status).toBe(200)
    expect(response.data.apps).toHaveLength(2)
    expect(response.data.apps[0].app_id).toBe('app-shorebird-demo')
  })
})
