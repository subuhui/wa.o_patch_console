import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: {
      title: '登录鉴权',
      requiresAuth: false,
    },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/apps',
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'apps',
        name: 'apps',
        component: () => import('@/features/apps/views/AppsListView.vue'),
        meta: {
          title: '应用管理',
          icon: 'Grid',
        },
      },
      {
        path: 'apps/:appId/releases',
        name: 'releases',
        component: () => import('@/features/releases/views/ReleasesView.vue'),
        meta: {
          title: '版本发布',
          icon: 'Files',
        },
      },
      {
        path: 'apps/:appId/patches',
        name: 'patches',
        component: () => import('@/features/patches/views/PatchesView.vue'),
        meta: {
          title: '补丁管理',
          icon: 'Cpu',
        },
      },
      {
        path: 'diagnostics',
        name: 'diagnostics',
        component: () => import('@/features/diagnostics/views/DiagnosticsView.vue'),
        meta: {
          title: '测速与诊断',
          icon: 'Odometer',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/apps',
  },
]
