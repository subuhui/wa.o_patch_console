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
      <el-button link class="collapse-btn" @click="appConfigStore.toggleSidebar">
        <el-icon :size="20">
          <component :is="appConfigStore.isCollapse ? Expand : Fold" />
        </el-icon>
      </el-button>

      <div
        v-if="authStore.isAuthenticated && appsData?.apps && appsData.apps.length > 0"
        class="current-app-selector"
      >
        <el-select
          v-model="selectedAppId"
          placeholder="切换当前应用"
          size="default"
          style="width: 220px"
        >
          <el-option
            v-for="app in appsData.apps"
            :key="app.app_id"
            :label="app.display_name"
            :value="app.app_id"
          />
        </el-select>
      </div>
    </div>

    <div class="header-right flex-center">
      <!-- Theme toggle -->
      <el-tooltip
        :content="appConfigStore.isDark ? '切换至亮色模式' : '切换至暗色模式'"
        placement="bottom"
      >
        <el-button circle link class="theme-btn" @click="appConfigStore.toggleDark()">
          <el-icon :size="18">
            <component :is="appConfigStore.isDark ? Sunny : Moon" />
          </el-icon>
        </el-button>
      </el-tooltip>

      <!-- User Dropdown -->
      <el-dropdown trigger="click">
        <span class="user-avatar-trigger flex-center">
          <el-avatar :size="32" :icon="UserFilled" />
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="SwitchButton" @click="handleLogout">
              退出登录
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
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  gap: 16px;
}

.header-right {
  gap: 16px;
}

.user-avatar-trigger {
  cursor: pointer;
}
</style>
