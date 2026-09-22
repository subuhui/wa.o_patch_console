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
  <el-aside :width="appConfigStore.isCollapse ? '68px' : '240px'" class="app-sidebar">
    <!-- Brand Header -->
    <div class="logo-area" :class="{ 'is-collapsed': appConfigStore.isCollapse }">
      <div class="logo-icon-wrapper flex-center">
        <svg
          class="shorebird-svg"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 13.5L12 4.5L21 13.5L18 19.5L12 16.5L6 19.5L3 13.5Z"
            fill="url(#sb-gradient)"
          />
          <defs>
            <linearGradient
              id="sb-gradient"
              x1="3"
              y1="4.5"
              x2="21"
              y2="19.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#38BDF8" />
              <stop offset="0.5" stop-color="#3B82F6" />
              <stop offset="1" stop-color="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div v-if="!appConfigStore.isCollapse" class="logo-text-group">
        <span class="logo-title">Shorebird</span>
        <span class="logo-badge">CONSOLE</span>
      </div>
    </div>

    <!-- Navigation Menu -->
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

      <el-tooltip
        :disabled="!(!currentAppId && !appConfigStore.isCollapse)"
        content="请先在应用列表选择一个应用"
        placement="right"
      >
        <el-menu-item index="releases" :disabled="!currentAppId">
          <el-icon><Files /></el-icon>
          <template #title>版本发布</template>
        </el-menu-item>
      </el-tooltip>

      <el-tooltip
        :disabled="!(!currentAppId && !appConfigStore.isCollapse)"
        content="请先在应用列表选择一个应用"
        placement="right"
      >
        <el-menu-item index="patches" :disabled="!currentAppId">
          <el-icon><Cpu /></el-icon>
          <template #title>补丁管理</template>
        </el-menu-item>
      </el-tooltip>

      <el-menu-item index="diagnostics">
        <el-icon><Odometer /></el-icon>
        <template #title>测速诊断</template>
      </el-menu-item>
    </el-menu>

    <!-- Sidebar Bottom Status / Info -->
    <div class="sidebar-footer">
      <div v-if="!appConfigStore.isCollapse" class="status-card">
        <div class="server-status flex-between">
          <div class="flex-start" style="gap: 8px">
            <span class="status-dot active pulse" />
            <span class="status-title">私有服务节点</span>
          </div>
          <el-tag size="small" type="success" effect="light" round>在线</el-tag>
        </div>
        <div class="server-meta flex-between">
          <span class="meta-label">协议版本</span>
          <span class="code-badge">v0.1.0</span>
        </div>
      </div>
      <div v-else class="collapsed-status flex-center">
        <el-tooltip content="私有服务节点：在线 (v0.1.0)" placement="right">
          <span class="status-dot active pulse" />
        </el-tooltip>
      </div>
    </div>
  </el-aside>
</template>

<style scoped>
.app-sidebar {
  border-right: 1px solid var(--surface-border);
  background-color: var(--el-bg-color);
  transition: width 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  height: 100vh;
  user-select: none;
}

.logo-area {
  height: var(--app-header-height);
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--surface-border);
  transition: padding 0.24s ease;

  &.is-collapsed {
    padding: 0;
    justify-content: center;
  }
}

.logo-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12));
  border: 1px solid rgba(59, 130, 246, 0.2);
  flex-shrink: 0;
}

.shorebird-svg {
  width: 22px;
  height: 22px;
}

.logo-text-group {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
}

.logo-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.logo-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 999px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-7);
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  padding: 12px 8px;

  :deep(.el-menu-item) {
    border-radius: 8px;
    margin-bottom: 4px;
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 600;

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    &.is-disabled {
      opacity: 0.45;
    }
  }
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--surface-border);
}

.status-card {
  background-color: var(--el-fill-color-lighter);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 10px 12px;
}

.server-status {
  margin-bottom: 8px;
}

.status-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.server-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.collapsed-status {
  height: 40px;
}
</style>
