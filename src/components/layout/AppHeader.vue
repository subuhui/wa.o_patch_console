<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppConfigStore } from '@/stores/app-config'
import { useQuery } from '@tanstack/vue-query'
import apiClient from '@/api/client'
import { Fold, Expand, Moon, Sunny, UserFilled, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

interface AppMetadata {
  app_id: string
  display_name: string
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appConfigStore = useAppConfigStore()

const { data: appsData } = useQuery<{ apps: AppMetadata[] }>({
  queryKey: ['apps'],
  queryFn: async () => {
    const res = await apiClient.get('/apps')
    return res.data
  },
  enabled: computed(() => authStore.isAuthenticated),
})

const selectedAppId = computed({
  get: () => (route.params.appId as string) || authStore.currentAppId || '',
  set: val => {
    authStore.setCurrentAppId(val)
    if (route.name === 'releases' || route.name === 'patches') {
      router.push({ name: route.name, params: { appId: val } })
    } else {
      router.push({ name: 'releases', params: { appId: val } })
    }
  },
})

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    authStore.logout()
    ElMessage.success('已退出登录')
    router.push({ name: 'login' })
  } catch {
    // User cancelled
  }
}
</script>

<template>
  <el-header class="app-header flex-between">
    <div class="header-left flex-center">
      <el-tooltip
        :content="appConfigStore.isCollapse ? '展开侧边栏' : '收起侧边栏'"
        placement="bottom"
      >
        <el-button class="collapse-btn" text circle @click="appConfigStore.toggleSidebar">
          <el-icon :size="18">
            <component :is="appConfigStore.isCollapse ? Expand : Fold" />
          </el-icon>
        </el-button>
      </el-tooltip>

      <div class="header-breadcrumb flex-center">
        <span class="workspace-label">Shorebird Private</span>
        <span class="breadcrumb-separator">/</span>
        <span class="current-section">{{ route.meta.title || '控制台' }}</span>
      </div>

      <div
        v-if="authStore.isAuthenticated && appsData?.apps && appsData.apps.length > 0"
        class="current-app-selector"
      >
        <el-select
          v-model="selectedAppId"
          placeholder="切换选中应用"
          size="small"
          class="app-select"
          style="width: 200px"
        >
          <el-option
            v-for="app in appsData.apps"
            :key="app.app_id"
            :label="app.display_name"
            :value="app.app_id"
          >
            <div class="flex-between" style="width: 100%">
              <span>{{ app.display_name }}</span>
              <span class="code-badge" style="font-size: 10px; margin-left: 8px"
                >{{ app.app_id.slice(0, 10) }}...</span
              >
            </div>
          </el-option>
        </el-select>
      </div>
    </div>

    <div class="header-right flex-center">
      <!-- Fast Diagnostics Link -->
      <el-tooltip content="网络吞吐与节点诊断" placement="bottom">
        <el-button
          text
          round
          size="small"
          class="diag-quick-btn"
          @click="router.push({ name: 'diagnostics' })"
        >
          <span class="status-dot active" style="margin-right: 6px" />
          <span class="diag-text">集群活跃</span>
        </el-button>
      </el-tooltip>

      <el-divider direction="vertical" style="height: 18px" />

      <!-- Theme toggle -->
      <el-tooltip
        :content="appConfigStore.isDark ? '切换至明亮模式' : '切换至暗黑模式'"
        placement="bottom"
      >
        <el-button circle text class="theme-btn" @click="appConfigStore.toggleDark()">
          <el-icon :size="18">
            <component :is="appConfigStore.isDark ? Sunny : Moon" />
          </el-icon>
        </el-button>
      </el-tooltip>

      <!-- User Dropdown -->
      <el-dropdown trigger="click">
        <div class="user-avatar-trigger flex-center">
          <el-avatar :size="30" class="user-avatar" :icon="UserFilled" />
          <span class="user-role-text">开发者</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown-menu">
            <div class="user-dropdown-header">
              <div class="user-name">Shorebird Admin</div>
              <div class="user-token-preview">
                Token: <span class="code-badge">sb_api_...</span>
              </div>
            </div>
            <el-divider style="margin: 6px 0" />
            <el-dropdown-item :icon="SwitchButton" @click="handleLogout">
              退出当前登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<style scoped>
.app-header {
  height: var(--app-header-height);
  padding: 0 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--surface-border);
  transition:
    background-color 0.24s ease,
    border-color 0.24s ease;
  user-select: none;
}

.header-left {
  gap: 14px;
}

.collapse-btn {
  color: var(--el-text-color-regular);
  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }
}

.header-breadcrumb {
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.workspace-label {
  color: var(--el-text-color-secondary);
}

.breadcrumb-separator {
  color: var(--el-border-color-darker);
}

.current-section {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.current-app-selector {
  margin-left: 8px;
}

.header-right {
  gap: 12px;
}

.diag-quick-btn {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  padding: 4px 10px;
  background-color: var(--el-fill-color-lighter);
  border: 1px solid var(--surface-border);

  &:hover {
    background-color: var(--el-fill-color);
  }
}

.theme-btn {
  color: var(--el-text-color-regular);
  transition:
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    color 0.2s ease;

  &:hover {
    transform: rotate(15deg);
    color: var(--el-color-primary);
  }
}

.user-avatar-trigger {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  gap: 8px;
  transition: background-color 0.18s ease;

  &:hover {
    background-color: var(--el-fill-color-light);
  }
}

.user-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #ffffff;
}

.user-role-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.user-dropdown-header {
  padding: 8px 16px;
  min-width: 180px;
}

.user-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.user-token-preview {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
