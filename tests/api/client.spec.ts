import { describe, it, expect, beforeEach } from 'vitest'
import apiClient from '@/api/client'

interface AppItem {
  app_id: string
  display_name: string
}

interface ChannelItem {
  id: number
  name: string
}

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('automatically adds Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('shorebird_token', 'my_bearer_token')

    const response = await apiClient.get('/users/me')
    expect(response.status).toBe(200)
    expect(response.data.email).toBe('admin@shorebird.local')
  })

  it('fetches apps list correctly via MSW', async () => {
    const response = await apiClient.get('/apps')
    expect(response.status).toBe(200)
    expect(response.data.apps.length).toBeGreaterThanOrEqual(2)
  })

  it('successfully creates, renames, and deletes an app statefully', async () => {
    // 1. Create app
    const createRes = await apiClient.post('/apps', { display_name: 'Brand New App' })
    expect(createRes.status).toBe(201)
    const newAppId = createRes.data.id

    // Verify it appears in list
    let listRes = await apiClient.get('/apps')
    let found = (listRes.data.apps as AppItem[]).find(a => a.app_id === newAppId)
    expect(found).toBeDefined()
    expect(found?.display_name).toBe('Brand New App')

    // 2. Rename app with both name and display_name
    const patchRes = await apiClient.patch(`/apps/${newAppId}`, {
      name: 'Renamed Brand App',
      display_name: 'Renamed Brand App',
    })
    expect(patchRes.status).toBe(204)

    // Verify rename took effect
    listRes = await apiClient.get('/apps')
    found = (listRes.data.apps as AppItem[]).find(a => a.app_id === newAppId)
    expect(found?.display_name).toBe('Renamed Brand App')

    // 3. Delete app
    const deleteRes = await apiClient.delete(`/apps/${newAppId}`)
    expect(deleteRes.status).toBe(204)

    // Verify app is removed from list
    listRes = await apiClient.get('/apps')
    found = (listRes.data.apps as AppItem[]).find(a => a.app_id === newAppId)
    expect(found).toBeUndefined()
  })

  it('statefully manages channels', async () => {
    const appId = 'app-shorebird-demo'
    // Create channel
    const createCh = await apiClient.post(`/apps/${appId}/channels`, { channel: 'qa-channel' })
    expect(createCh.status).toBe(201)
    const channelId = createCh.data.id

    // Verify channel exists
    let listCh = await apiClient.get(`/apps/${appId}/channels`)
    let foundCh = (listCh.data as ChannelItem[]).find(c => c.id === channelId)
    expect(foundCh).toBeDefined()
    expect(foundCh?.name).toBe('qa-channel')

    // Delete channel
    const delCh = await apiClient.delete(`/apps/${appId}/channels/${channelId}`)
    expect(delCh.status).toBe(204)

    // Verify channel deleted
    listCh = await apiClient.get(`/apps/${appId}/channels`)
    foundCh = (listCh.data as ChannelItem[]).find(c => c.id === channelId)
    expect(foundCh).toBeUndefined()
  })
})
