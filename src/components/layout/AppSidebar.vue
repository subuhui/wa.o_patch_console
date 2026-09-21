<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppConfigStore } from '@/stores/app-config'
import { useAuthStore } from '@/stores/auth'
import { Grid, Files, Cpu, Odometer } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appConfigStore = useAppConfigStore()
const authStore = useAuthStore()

const currentAppId = computed(() => {
  return (route.params.appId as string) || authStore.currentAppId || ''
})

const activeMenu = computed(() => {
  if (route.name === 'releases') return 'releases'
  if (route.name === 'patches') return 'patches'
  if (route.name === 'diagnostics') return 'diagnostics'
  return 'apps'
})

function handleSelect(index: string) {
  if (index === 'apps') {
    router.push({ name: 'apps' })
  } else if (index === 'releases') {
    if (currentAppId.value) {
      router.push({ name: 'releases', params: { appId: currentAppId.value } })
    }
  } else if (index === 'patches') {
    if (currentAppId.value) {
      router.push({ name: 'patches', params: { appId: currentAppId.value } })
    }
  } else if (index === 'diagnostics') {
    router.push({ name: 'diagnostics' })
  }
}
</script>

<template>
  <el-aside :width="appConfigStore.isCollapse ? '64px' : '240px'" class="app-sidebar">
    <div class="logo-area flex-center">
      <el-icon :size="24" color="#409EFF"><Cpu /></el-icon>
      <span v-if="!appConfigStore.isCollapse" class="logo-title">Shorebird</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      :collapse="appConfigStore.isCollapse"
      class="sidebar-menu"
      @select="handleSelect"
    >
      <el-menu-item index="apps">
        <el-icon><Grid /></el-icon>
        <template #title>应用列表</template>
      </el-menu-item>

      <el-menu-item index="releases" :disabled="!currentAppId">
        <el-icon><Files /></el-icon>
        <template #title>版本发布</template>
      </el-menu-item>

      <el-menu-item index="patches" :disabled="!currentAppId">
        <el-icon><Cpu /></el-icon>
        <template #title>补丁管理</template>
      </el-menu-item>

      <el-menu-item index="diagnostics">
        <el-icon><Odometer /></el-icon>
        <template #title>测速诊断</template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<style scoped>
.app-sidebar {
  border-right: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.logo-area {
  height: var(--app-header-height);
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: 600;
  font-size: 1.1rem;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}
</style>
