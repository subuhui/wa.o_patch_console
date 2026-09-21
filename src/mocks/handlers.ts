import { http, HttpResponse } from 'msw'

// In-memory stateful mock database
export interface MockApp {
  app_id: string
  display_name: string
  latest_release_version?: string | null
  latest_patch_number?: number | null
  created_at: string
  updated_at: string
  platforms: string[]
}

export interface MockChannel {
  id: number
  app_id: string
  name: string
}

export interface MockRelease {
  id: number
  app_id: string
  version: string
  flutter_revision: string
  flutter_version?: string | null
  display_name?: string | null
  platform_statuses: Record<string, string>
  created_at: string
  updated_at: string
}

export interface MockPatchArtifact {
  id: number
  patch_id: number
  arch: string
  platform: string
  hash: string
  size: number
  created_at: string
}

export interface MockPatch {
  id: number
  app_id: string
  release_id: number
  number: number
  channel?: string | null
  artifacts: MockPatchArtifact[]
  is_rolled_back: boolean
}

let mockApps: MockApp[] = [
  {
    app_id: 'app-shorebird-demo',
    display_name: 'Shorebird Demo App',
    latest_release_version: '1.0.0+1',
    latest_patch_number: 3,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-20T12:00:00Z',
    platforms: ['android', 'ios'],
  },
  {
    app_id: 'app-ecommerce-client',
    display_name: 'E-Commerce Mobile',
    latest_release_version: '2.1.0+15',
    latest_patch_number: 1,
    created_at: '2026-08-15T08:30:00Z',
    updated_at: '2026-09-18T16:20:00Z',
    platforms: ['android'],
  },
]

let mockChannels: MockChannel[] = [
  { id: 1, app_id: 'app-shorebird-demo', name: 'stable' },
  { id: 2, app_id: 'app-shorebird-demo', name: 'beta' },
  { id: 3, app_id: 'app-shorebird-demo', name: 'staging' },
  { id: 4, app_id: 'app-shorebird-demo', name: 'canary' },
]

let mockReleases: MockRelease[] = [
  {
    id: 101,
    app_id: 'app-shorebird-demo',
    version: '1.0.0+1',
    flutter_revision: 'c6d2c4990d4081c7e937d5830b91e920d32b4b45',
    flutter_version: '3.29.0',
    display_name: 'Release 1.0.0+1',
    platform_statuses: {
      android: 'active',
      ios: 'active',
    },
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:30:00Z',
  },
  {
    id: 102,
    app_id: 'app-shorebird-demo',
    version: '1.0.1+2',
    flutter_revision: 'c6d2c4990d4081c7e937d5830b91e920d32b4b45',
    flutter_version: '3.29.0',
    display_name: 'Release 1.0.1+2',
    platform_statuses: {
      android: 'active',
    },
    created_at: '2026-09-15T09:00:00Z',
    updated_at: '2026-09-15T09:15:00Z',
  },
]

const mockPatches: MockPatch[] = [
  {
    id: 901,
    app_id: 'app-shorebird-demo',
    release_id: 101,
    number: 1,
    channel: 'stable',
    is_rolled_back: false,
    artifacts: [
      {
        id: 1001,
        patch_id: 901,
        arch: 'aarch64',
        platform: 'android',
        hash: 'fa598124b89...',
        size: 42890,
        created_at: '2026-09-02T14:10:00Z',
      },
    ],
  },
  {
    id: 902,
    app_id: 'app-shorebird-demo',
    release_id: 101,
    number: 2,
    channel: 'stable',
    is_rolled_back: false,
    artifacts: [
      {
        id: 1002,
        patch_id: 902,
        arch: 'aarch64',
        platform: 'android',
        hash: 'da39a3ee5e6...',
        size: 51200,
        created_at: '2026-09-10T09:25:00Z',
      },
    ],
  },
]

export function resetMockDb() {
  // Can be called to reset mock state in tests
}

export const handlers = [
  // Current user
  http.get('/api/v1/users/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'admin@shorebird.local',
      display_name: 'Su Huihui',
      has_active_subscription: true,
      jwt_issuer: 'https://shorebird.local',
      patch_overage_limit: 10000,
    })
  }),

  // Apps list
  http.get('/api/v1/apps', () => {
    return HttpResponse.json({
      apps: mockApps,
    })
  }),

  // Create App
  http.post('/api/v1/apps', async ({ request }) => {
    const body = (await request.json()) as { display_name?: string; name?: string }
    const name = (body.display_name || body.name || 'Untitled App').trim()
    const newApp: MockApp = {
      app_id: `app-${Date.now()}`,
      display_name: name,
      latest_release_version: null,
      latest_patch_number: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      platforms: ['android', 'ios'],
    }
    mockApps = [newApp, ...mockApps]
    return HttpResponse.json(
      {
        id: newApp.app_id,
        display_name: newApp.display_name,
      },
      { status: 201 },
    )
  }),

  // Rename App (supports both { name } and { display_name })
  http.patch('/api/v1/apps/:app_id', async ({ params, request }) => {
    const body = (await request.json()) as { display_name?: string; name?: string }
    const appId = params.app_id as string
    const newName = (body.name || body.display_name || '').trim()

    const targetApp = mockApps.find(a => a.app_id === appId)
    if (targetApp && newName) {
      targetApp.display_name = newName
      targetApp.updated_at = new Date().toISOString()
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Delete App
  http.delete('/api/v1/apps/:app_id', ({ params }) => {
    const appId = params.app_id as string
    mockApps = mockApps.filter(a => a.app_id !== appId)
    return new HttpResponse(null, { status: 204 })
  }),

  // Channels
  http.get('/api/v1/apps/:app_id/channels', ({ params }) => {
    const appId = params.app_id as string
    const channels = mockChannels.filter(c => c.app_id === appId)
    if (channels.length === 0) {
      // Return default channels if none exist yet
      return HttpResponse.json([
        { id: 1, app_id: appId, name: 'stable' },
        { id: 2, app_id: appId, name: 'beta' },
        { id: 3, app_id: appId, name: 'staging' },
      ])
    }
    return HttpResponse.json(channels)
  }),

  // Create Channel
  http.post('/api/v1/apps/:app_id/channels', async ({ params, request }) => {
    const body = (await request.json()) as { channel: string }
    const newChannel: MockChannel = {
      id: Date.now(),
      app_id: params.app_id as string,
      name: body.channel.trim(),
    }
    mockChannels.push(newChannel)
    return HttpResponse.json(newChannel, { status: 201 })
  }),

  // Delete Channel
  http.delete('/api/v1/apps/:app_id/channels/:channel_id', ({ params }) => {
    const channelId = Number(params.channel_id)
    mockChannels = mockChannels.filter(c => c.id !== channelId)
    return new HttpResponse(null, { status: 204 })
  }),

  // Releases
  http.get('/api/v1/apps/:app_id/releases', ({ params }) => {
    const appId = params.app_id as string
    const releases = mockReleases.filter(r => r.app_id === appId)
    return HttpResponse.json({
      releases: releases.length > 0 ? releases : mockReleases,
    })
  }),

  // Create Release
  http.post('/api/v1/apps/:app_id/releases', async ({ params, request }) => {
    const body = (await request.json()) as {
      version: string
      flutter_revision: string
      flutter_version?: string
    }
    const newRelease: MockRelease = {
      id: Date.now(),
      app_id: params.app_id as string,
      version: body.version,
      flutter_revision: body.flutter_revision,
      flutter_version: body.flutter_version || '3.29.0',
      display_name: `Release ${body.version}`,
      platform_statuses: { android: 'active' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockReleases = [newRelease, ...mockReleases]
    return HttpResponse.json({ release: newRelease }, { status: 201 })
  }),

  // Release Artifacts
  http.get('/api/v1/apps/:app_id/releases/:release_id/artifacts', ({ params }) => {
    return HttpResponse.json({
      artifacts: [
        {
          id: 501,
          release_id: Number(params.release_id),
          arch: 'aarch64',
          platform: 'android',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          size: 24582912,
          url: '/api/v1/storage/download?key=android-arm64-v1.0.0.so',
          can_sideload: true,
        },
        {
          id: 502,
          release_id: Number(params.release_id),
          arch: 'arm64',
          platform: 'ios',
          hash: 'cb47ec1fcd066fcff29b3c434f0e57f20e4ee54559eb4cf21d283ad87bf3a20e',
          size: 31204856,
          url: '/api/v1/storage/download?key=ios-arm64-v1.0.0.ipa',
          can_sideload: false,
          podfile_lock_hash: '9a5c88b0',
        },
      ],
    })
  }),

  // Patches
  http.get('/api/v1/apps/:app_id/releases/:release_id/patches', () => {
    return HttpResponse.json({
      patches: mockPatches,
    })
  }),

  // Promote Patch
  http.post('/api/v1/apps/:app_id/patches/promote', async ({ request }) => {
    const body = (await request.json()) as { patch_id?: number; channel_id?: number }
    const patch = mockPatches.find(p => p.id === body.patch_id)
    if (patch) {
      const channel = mockChannels.find(c => c.id === body.channel_id)
      patch.channel = channel ? channel.name : 'stable'
      patch.is_rolled_back = false
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Rollback Patch
  http.post('/api/v1/apps/:app_id/patches/:patch_id/rollback', ({ params }) => {
    const patchId = Number(params.patch_id)
    const patch = mockPatches.find(p => p.id === patchId)
    if (patch) {
      patch.is_rolled_back = true
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Rollforward Patch
  http.post(
    '/api/v1/apps/:app_id/releases/:release_id/patches/:patch_id/rollforward',
    ({ params }) => {
      const patchId = Number(params.patch_id)
      const patch = mockPatches.find(p => p.id === patchId)
      if (patch) {
        patch.is_rolled_back = false
      }
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // Diagnostics links
  http.get('/api/v1/diagnostics/gcp_download', () => {
    return HttpResponse.json({
      url: '/api/v1/diagnostics/download?token=mock_diag_token_download_123',
    })
  }),

  http.get('/api/v1/diagnostics/download', () => {
    // Return 2MB mock binary data for speed test
    const data = new Uint8Array(2 * 1024 * 1024)
    return new HttpResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(data.byteLength),
      },
    })
  }),

  http.get('/api/v1/diagnostics/gcp_upload', () => {
    return HttpResponse.json({
      url: '/api/v1/diagnostics/upload?token=mock_diag_token_upload_123',
    })
  }),

  http.post('/api/v1/diagnostics/upload', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
