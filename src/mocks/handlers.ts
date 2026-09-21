import { http, HttpResponse } from 'msw'

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
      apps: [
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
      ],
    })
  }),

  // Create App
  http.post('/api/v1/apps', async ({ request }) => {
    const body = (await request.json()) as { display_name: string }
    return HttpResponse.json(
      {
        id: `app-${Date.now()}`,
        display_name: body.display_name,
      },
      { status: 201 },
    )
  }),

  // Rename App
  http.patch('/api/v1/apps/:app_id', async ({ params, request }) => {
    const body = (await request.json()) as { display_name: string }
    return HttpResponse.json({
      id: params.app_id as string,
      display_name: body.display_name,
    })
  }),

  // Delete App
  http.delete('/api/v1/apps/:app_id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Channels
  http.get('/api/v1/apps/:app_id/channels', ({ params }) => {
    return HttpResponse.json([
      { id: 1, app_id: params.app_id, name: 'stable' },
      { id: 2, app_id: params.app_id, name: 'beta' },
      { id: 3, app_id: params.app_id, name: 'staging' },
      { id: 4, app_id: params.app_id, name: 'canary' },
    ])
  }),

  // Create Channel
  http.post('/api/v1/apps/:app_id/channels', async ({ params, request }) => {
    const body = (await request.json()) as { channel: string }
    return HttpResponse.json(
      {
        id: Date.now(),
        app_id: params.app_id,
        name: body.channel,
      },
      { status: 201 },
    )
  }),

  // Delete Channel
  http.delete('/api/v1/apps/:app_id/channels/:channel_id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Releases
  http.get('/api/v1/apps/:app_id/releases', ({ params }) => {
    return HttpResponse.json({
      releases: [
        {
          id: 101,
          app_id: params.app_id as string,
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
          app_id: params.app_id as string,
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
      ],
    })
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
          url: '/api/v1/storage/download/android-arm64-v1.0.0.so',
          can_sideload: true,
        },
        {
          id: 502,
          release_id: Number(params.release_id),
          arch: 'arm64',
          platform: 'ios',
          hash: 'cb47ec1fcd066fcff29b3c434f0e57f20e4ee54559eb4cf21d283ad87bf3a20e',
          size: 31204856,
          url: '/api/v1/storage/download/ios-arm64-v1.0.0.ipa',
          can_sideload: false,
          podfile_lock_hash: '9a5c88b0',
        },
      ],
    })
  }),

  // Patches
  http.get('/api/v1/apps/:app_id/releases/:release_id/patches', () => {
    return HttpResponse.json({
      patches: [
        {
          id: 901,
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
      ],
    })
  }),

  // Promote Patch
  http.post('/api/v1/apps/:app_id/patches/promote', () => {
    return HttpResponse.json({ message: 'Patch promoted successfully' })
  }),

  // Rollback Patch
  http.post('/api/v1/apps/:app_id/patches/:patch_id/rollback', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Rollforward Patch
  http.post('/api/v1/apps/:app_id/releases/:release_id/patches/:patch_id/rollforward', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Diagnostics links
  http.get('/api/v1/diagnostics/gcp_download', () => {
    return HttpResponse.json({
      url: '/api/v1/diagnostics/download?token=mock_diag_token_download_123',
    })
  }),

  http.get('/api/v1/diagnostics/gcp_upload', () => {
    return HttpResponse.json({
      url: '/api/v1/diagnostics/upload?token=mock_diag_token_upload_123',
    })
  }),
]
