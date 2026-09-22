<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { InputInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'
import {
  Edit,
  Delete,
  Files,
  Cpu,
  Search,
  Refresh,
  Grid,
  List,
  CopyDocument,
  Check,
  Cellphone,
  Apple,
  MoreFilled,
  DocumentCopy,
  ArrowRight,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface AppMetadata {
  app_id: string
  display_name: string
  latest_release_version?: string | null
  latest_patch_number?: number | null
  created_at: string
  updated_at: string
  platforms: string[]
}

const router = useRouter()
const authStore = useAuthStore()
const queryClient = useQueryClient()

// Refs for keyboard shortcuts
const searchInputRef = ref<InputInstance | null>(null)

// Fetch apps
const { data, isLoading, refetch } = useQuery<{ apps: AppMetadata[] }>({
  queryKey: ['apps'],
  queryFn: async () => {
    const res = await apiClient.get('/apps')
    return res.data
  },
})

// Search & Filter state
const searchQuery = ref('')
const selectedPlatform = ref('all')
const viewMode = ref<'grid' | 'table'>(
  (localStorage.getItem('shorebird_apps_view') as 'grid' | 'table') || 'grid',
)

function setViewMode(mode: 'grid' | 'table') {
  viewMode.value = mode
  localStorage.setItem('shorebird_apps_view', mode)
}

// Global keyboard shortcuts: "/" or "Cmd+K" / "Ctrl+K" to focus search; "Esc" to clear
function handleGlobalKeydown(e: KeyboardEvent) {
  const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
    (e.target as HTMLElement)?.tagName || '',
  )

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  if (e.key === '/' && !isInputFocused) {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  if (e.key === 'Escape') {
    const activeEl = document.activeElement
    const inputEl = searchInputRef.value?.input || searchInputRef.value?.$el?.querySelector('input')
    if (activeEl === inputEl) {
      if (searchQuery.value) {
        searchQuery.value = ''
      } else {
        searchInputRef.value?.blur()
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// Filtered apps
const filteredApps = computed(() => {
  const list = data.value?.apps || []
  return list.filter(app => {
    const query = searchQuery.value.trim().toLowerCase()
    const matchesQuery =
      !query ||
      app.display_name.toLowerCase().includes(query) ||
      app.app_id.toLowerCase().includes(query)

    const matchesPlatform =
      selectedPlatform.value === 'all' ||
      app.platforms.some(p => p.toLowerCase() === selectedPlatform.value.toLowerCase())

    return matchesQuery && matchesPlatform
  })
})

// KPI Metrics
const totalAppsCount = computed(() => data.value?.apps?.length || 0)
const totalPatchesCount = computed(() => {
  return (data.value?.apps || []).reduce((acc, app) => acc + (app.latest_patch_number || 0), 0)
})
const allPlatforms = computed(() => {
  const set = new Set<string>()
  ;(data.value?.apps || []).forEach(a => a.platforms.forEach(p => set.add(p.toLowerCase())))
  return Array.from(set)
})

// Avatar generation
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
]

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

function getAppInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

// Copy to clipboard with instant feedback
const copiedId = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyText(text: string, id: string, tip = '已复制到剪贴板') {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    ElMessage.success(tip)
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch {
    ElMessage.error('复制失败，请手动选择')
  }
}

// YAML config modal
const yamlDialogVisible = ref(false)
const selectedYamlApp = ref<AppMetadata | null>(null)

function openYamlModal(app: AppMetadata) {
  selectedYamlApp.value = app
  yamlDialogVisible.value = true
}

const yamlSnippet = computed(() => {
  if (!selectedYamlApp.value) return ''
  return `# shorebird.yaml
# 将此配置文件置于您的 Flutter 工程根目录
app_id: ${selectedYamlApp.value.app_id}
auto_update: true
`
})

// Rename app
async function handleRename(app: AppMetadata) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的应用名称', '重命名应用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: app.display_name,
      inputPattern: /^.{2,50}$/,
      inputErrorMessage: '应用名称长度需在 2 到 50 个字符之间',
    })
    if (value && value.trim()) {
      const newName = value.trim()
      await apiClient.patch(`/apps/${app.app_id}`, {
        name: newName,
        display_name: newName,
      })
      ElMessage.success('重命名成功')
      await queryClient.invalidateQueries({ queryKey: ['apps'] })
    }
  } catch {
    // cancelled
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Delete app with explicit name confirmation safeguard
async function handleDelete(app: AppMetadata) {
  try {
    await ElMessageBox.prompt(
      `此操作将永久删除应用及其所有 Release 底包构建和历史补丁，无法撤销！\n请输入应用名称 "${app.display_name}" 确认删除：`,
      '危险删除警告',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        inputPlaceholder: app.display_name,
        inputPattern: new RegExp(`^${escapeRegExp(app.display_name)}$`),
        inputErrorMessage: '输入的名称与当前应用不一致',
      },
    )
    await apiClient.delete(`/apps/${app.app_id}`)
    ElMessage.success(`应用 "${app.display_name}" 已永久删除`)
    if (authStore.currentAppId === app.app_id) {
      authStore.setCurrentAppId(null)
    }
    queryClient.invalidateQueries({ queryKey: ['apps'] })
  } catch {
    // cancelled
  }
}

function selectApp(appId: string) {
  authStore.setCurrentAppId(appId)
  router.push({ name: 'releases', params: { appId } })
}

function goToPatches(appId: string) {
  authStore.setCurrentAppId(appId)
  router.push({ name: 'patches', params: { appId } })
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="apps-page">
    <!-- Top Hero Header -->
    <div class="page-header flex-between">
      <div class="header-titles">
        <h1 class="page-title">应用管理</h1>
        <p class="page-desc">
          登记与管理私有热更新服务器中的 Flutter 客户端产品，掌握底包构建与在线补丁分发
        </p>
      </div>
      <div class="header-actions flex-center">
        <el-tooltip content="刷新列表数据" placement="top">
          <el-button circle :icon="Refresh" :loading="isLoading" @click="() => refetch()" />
        </el-tooltip>
      </div>
    </div>

    <!-- KPI Metrics Dashboard Strip -->
    <el-row :gutter="16" class="metrics-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="metric-card">
          <div class="metric-inner flex-between">
            <div>
              <div class="metric-label">已管理应用</div>
              <div class="metric-value">{{ totalAppsCount }}</div>
              <div class="metric-sub">在线登记工程</div>
            </div>
            <div class="metric-icon-wrap blue flex-center">
              <el-icon :size="20"><Grid /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="metric-card">
          <div class="metric-inner flex-between">
            <div>
              <div class="metric-label">累计发布补丁</div>
              <div class="metric-value">{{ totalPatchesCount }}</div>
              <div class="metric-sub">热更新补丁总计</div>
            </div>
            <div class="metric-icon-wrap emerald flex-center">
              <el-icon :size="20"><Cpu /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="metric-card">
          <div class="metric-inner flex-between">
            <div>
              <div class="metric-label">覆盖终端平台</div>
              <div class="metric-value">{{ allPlatforms.length || 2 }}</div>
              <div class="metric-sub">
                {{ allPlatforms.map(p => p.toUpperCase()).join(' / ') || 'ANDROID / IOS' }}
              </div>
            </div>
            <div class="metric-icon-wrap violet flex-center">
              <el-icon :size="20"><Cellphone /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="metric-card">
          <div class="metric-inner flex-between">
            <div>
              <div class="metric-label">服务运行状态</div>
              <div class="metric-value status-text flex-start">
                <span class="status-dot active pulse" style="margin-right: 8px" />
                <span>正常连接</span>
              </div>
              <div class="metric-sub">私有补丁存储集群</div>
            </div>
            <div class="metric-icon-wrap green flex-center">
              <el-icon :size="20"><Files /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Toolbar: Search, Filters & View Toggle -->
    <div class="toolbar-card flex-between">
      <div class="toolbar-left flex-center">
        <!-- Search Input -->
        <el-input
          ref="searchInputRef"
          v-model="searchQuery"
          placeholder="搜索应用名称或 App ID..."
          clearable
          :prefix-icon="Search"
          class="search-input"
        >
          <template #suffix>
            <div class="search-kbd-wrap flex-center">
              <kbd v-if="!searchQuery" class="search-kbd" title="按下 '/' 键快速聚焦">/</kbd>
              <kbd
                v-else
                class="search-kbd esc"
                title="按下 'Esc' 键清空"
                @click.stop="searchQuery = ''"
              >
                Esc
              </kbd>
            </div>
          </template>
        </el-input>

        <!-- Platform Filter Pills -->
        <el-radio-group v-model="selectedPlatform" size="default" class="platform-filter">
          <el-radio-button value="all">全部平台</el-radio-button>
          <el-radio-button value="android">Android</el-radio-button>
          <el-radio-button value="ios">iOS</el-radio-button>
        </el-radio-group>
      </div>

      <div class="toolbar-right flex-center">
        <span class="count-badge">共 {{ filteredApps.length }} 个应用</span>
        <!-- View Mode Switcher -->
        <div class="view-mode-group flex-center">
          <el-tooltip content="卡片网格视图" placement="top">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="setViewMode('grid')"
            >
              <el-icon :size="16"><Grid /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="表格列表视图" placement="top">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'table' }"
              @click="setViewMode('table')"
            >
              <el-icon :size="16"><List /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- Empty State for Zero Search Results or Zero Data -->
    <div v-if="!isLoading && filteredApps.length === 0" class="empty-container">
      <el-card shadow="never" class="empty-card flex-center">
        <div class="empty-content">
          <div class="empty-icon-circle flex-center">
            <el-icon :size="36" color="#94a3b8"><Grid /></el-icon>
          </div>
          <h3 class="empty-title">
            {{
              searchQuery || selectedPlatform !== 'all'
                ? '未找到符合条件的应用'
                : '尚未登记任何应用'
            }}
          </h3>
          <p class="empty-desc">
            {{
              searchQuery || selectedPlatform !== 'all'
                ? '请尝试更换搜索关键字，或清除已选的平台筛选条件。'
                : '请在您的 Flutter 客户端工程目录下运行 shorebird init，CLI 将自动完成应用登记并同步到当前私有服务器。'
            }}
          </p>
          <div class="empty-action flex-center" style="gap: 12px">
            <el-button
              v-if="searchQuery || selectedPlatform !== 'all'"
              @click="
                () => {
                  searchQuery = ''
                  selectedPlatform = 'all'
                }
              "
            >
              清除所有筛选
            </el-button>
            <el-button v-else :icon="Refresh" :loading="isLoading" @click="() => refetch()">
              刷新列表
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Main View: Card Grid -->
    <div v-else-if="viewMode === 'grid'" v-loading="isLoading" class="app-grid-view">
      <el-row :gutter="18">
        <el-col
          v-for="app in filteredApps"
          :key="app.app_id"
          :xs="24"
          :sm="12"
          :lg="8"
          class="grid-col"
        >
          <el-card
            shadow="never"
            class="app-item-card is-interactive"
            tabindex="0"
            role="button"
            :aria-label="`进入应用 ${app.display_name}`"
            @click="selectApp(app.app_id)"
            @keydown.enter="selectApp(app.app_id)"
          >
            <!-- Card Header -->
            <div class="card-head flex-between">
              <div class="app-main-info flex-start">
                <div
                  class="app-avatar flex-center"
                  :style="{ background: getAvatarGradient(app.display_name) }"
                >
                  {{ getAppInitials(app.display_name) }}
                </div>
                <div class="app-text-info">
                  <div class="app-name-row flex-start">
                    <span class="app-title-link" @click.stop="selectApp(app.app_id)">
                      {{ app.display_name }}
                    </span>
                  </div>
                  <div class="app-id-pill flex-start">
                    <span class="id-label">ID:</span>
                    <span class="id-code">{{ app.app_id }}</span>
                    <el-tooltip
                      :content="copiedId === app.app_id ? '已复制！' : '复制 App ID'"
                      placement="top"
                    >
                      <button
                        class="copy-btn flex-center"
                        @click.stop="copyText(app.app_id, app.app_id, '已复制 App ID')"
                      >
                        <el-icon :size="12">
                          <component :is="copiedId === app.app_id ? Check : CopyDocument" />
                        </el-icon>
                      </button>
                    </el-tooltip>
                  </div>
                </div>
              </div>

              <!-- More Actions Dropdown -->
              <el-dropdown trigger="click">
                <button class="more-btn flex-center" @click.stop>
                  <el-icon :size="16"><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="DocumentCopy" @click="openYamlModal(app)">
                      查看 shorebird.yaml
                    </el-dropdown-item>
                    <el-dropdown-item :icon="Edit" @click="handleRename(app)">
                      重命名应用
                    </el-dropdown-item>
                    <el-dropdown-item
                      :icon="Delete"
                      divided
                      style="color: var(--el-color-danger)"
                      @click="handleDelete(app)"
                    >
                      删除应用
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- Platform Badges -->
            <div class="card-platforms flex-start">
              <span
                v-for="platform in app.platforms"
                :key="platform"
                class="platform-chip interactive"
                :class="platform.toLowerCase()"
                :title="`筛选 ${platform.toUpperCase()} 平台`"
                @click.stop="selectedPlatform = platform.toLowerCase()"
              >
                <el-icon :size="12" style="margin-right: 4px">
                  <component :is="platform.toLowerCase() === 'ios' ? Apple : Cellphone" />
                </el-icon>
                {{ platform.toUpperCase() }}
              </span>
            </div>

            <!-- Card Key Stats Grid -->
            <div class="card-stats-grid">
              <div class="stat-box">
                <span class="stat-box-label">最新底包</span>
                <span class="stat-box-value code-font">
                  {{ app.latest_release_version ? 'v' + app.latest_release_version : '暂无底包' }}
                </span>
              </div>
              <div class="stat-box">
                <span class="stat-box-label">最新补丁</span>
                <span class="stat-box-value">
                  <el-tag
                    v-if="app.latest_patch_number"
                    size="small"
                    type="success"
                    effect="light"
                    round
                  >
                    Patch #{{ app.latest_patch_number }}
                  </el-tag>
                  <span v-else class="empty-patch-text">无激活补丁</span>
                </span>
              </div>
            </div>

            <!-- Card Bottom Action Footer -->
            <div class="card-footer flex-between">
              <span class="update-time-text"> 更新于 {{ formatDate(app.updated_at) }} </span>

              <div class="action-btns flex-center" style="gap: 8px">
                <el-button size="small" :icon="Files" @click.stop="selectApp(app.app_id)">
                  底包版本
                </el-button>
                <el-button
                  type="primary"
                  plain
                  size="small"
                  :icon="Cpu"
                  @click.stop="goToPatches(app.app_id)"
                >
                  补丁管理
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Alternate View: Polished Dense Table -->
    <el-card v-else v-loading="isLoading" shadow="never" class="table-card">
      <el-table :data="filteredApps" stripe style="width: 100%">
        <el-table-column label="应用信息" min-width="240">
          <template #default="{ row }">
            <div class="table-app-cell flex-start">
              <div
                class="app-avatar-sm flex-center"
                :style="{ background: getAvatarGradient(row.display_name) }"
              >
                {{ getAppInitials(row.display_name) }}
              </div>
              <div>
                <el-link
                  type="primary"
                  underline="never"
                  class="app-name-link"
                  @click="selectApp(row.app_id)"
                >
                  {{ row.display_name }}
                </el-link>
                <div class="app-id-pill flex-start" style="margin-top: 2px">
                  <span class="id-code">{{ row.app_id }}</span>
                  <button
                    class="copy-btn-sm flex-center"
                    @click.stop="copyText(row.app_id, row.app_id, '已复制 App ID')"
                  >
                    <el-icon :size="11">
                      <component :is="copiedId === row.app_id ? Check : CopyDocument" />
                    </el-icon>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="支持平台" width="180">
          <template #default="{ row }">
            <div class="flex-start" style="gap: 6px">
              <span
                v-for="platform in row.platforms"
                :key="platform"
                class="platform-chip interactive"
                :class="platform.toLowerCase()"
                :title="`筛选 ${platform.toUpperCase()} 平台`"
                @click.stop="selectedPlatform = platform.toLowerCase()"
              >
                <el-icon :size="12" style="margin-right: 4px">
                  <component :is="platform.toLowerCase() === 'ios' ? Apple : Cellphone" />
                </el-icon>
                {{ platform.toUpperCase() }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="最新底包版本" width="160">
          <template #default="{ row }">
            <span v-if="row.latest_release_version" class="code-badge">
              v{{ row.latest_release_version }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="最新补丁" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.latest_patch_number" size="small" type="success" effect="light" round>
              Patch #{{ row.latest_patch_number }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="最后更新时间" min-width="170">
          <template #default="{ row }">
            <span class="text-muted">{{ formatDate(row.updated_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="快捷操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="flex-start" style="gap: 6px">
              <el-button link type="primary" :icon="Files" @click="selectApp(row.app_id)">
                版本
              </el-button>
              <el-button link type="primary" :icon="Cpu" @click="goToPatches(row.app_id)">
                补丁
              </el-button>
              <el-dropdown trigger="click">
                <el-button link type="info">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :icon="DocumentCopy"
                      @click="openYamlModal(row as AppMetadata)"
                    >
                      查看 shorebird.yaml
                    </el-dropdown-item>
                    <el-dropdown-item :icon="Edit" @click="handleRename(row as AppMetadata)">
                      重命名应用
                    </el-dropdown-item>
                    <el-dropdown-item
                      :icon="Delete"
                      divided
                      style="color: var(--el-color-danger)"
                      @click="handleDelete(row as AppMetadata)"
                    >
                      删除应用
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Developer Quick Guide Card -->
    <el-card shadow="never" class="cli-guide-card">
      <div class="cli-guide-header flex-between">
        <div class="flex-start" style="gap: 8px">
          <span class="code-badge" style="font-weight: 700">CLI</span>
          <span class="cli-guide-title">Shorebird Flutter 快速工作流</span>
        </div>
        <el-link
          type="primary"
          underline="never"
          href="https://docs.shorebird.dev"
          target="_blank"
          style="font-size: 12px"
        >
          官方文档
          <el-icon style="margin-left: 2px"><ArrowRight /></el-icon>
        </el-link>
      </div>

      <div class="cli-steps flex-start">
        <div class="cli-step-box">
          <span class="step-num">1</span>
          <span class="step-desc">关联客户端工程</span>
          <code class="step-code">shorebird init</code>
        </div>
        <div class="step-arrow flex-center">
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="cli-step-box">
          <span class="step-num">2</span>
          <span class="step-desc">构建并上传底包</span>
          <code class="step-code">shorebird release android</code>
        </div>
        <div class="step-arrow flex-center">
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="cli-step-box">
          <span class="step-num">3</span>
          <span class="step-desc">推送秒级热更补丁</span>
          <code class="step-code">shorebird patch android</code>
        </div>
      </div>
    </el-card>

    <!-- Shorebird YAML Config Modal -->
    <el-dialog
      v-model="yamlDialogVisible"
      :title="`shorebird.yaml - ${selectedYamlApp?.display_name || ''}`"
      width="520px"
    >
      <p class="yaml-dialog-desc">
        将下方配置保存为 Flutter 项目根目录下的 <code>shorebird.yaml</code>：
      </p>
      <div class="yaml-snippet-wrap">
        <pre class="yaml-snippet"><code>{{ yamlSnippet }}</code></pre>
      </div>
      <template #footer>
        <el-button @click="yamlDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :icon="CopyDocument"
          @click="copyText(yamlSnippet, 'yaml-code', '已复制 shorebird.yaml')"
        >
          复制 YAML 配置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.apps-page {
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Page Header */
.page-header {
  margin-bottom: 4px;
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.page-desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.header-actions {
  gap: 12px;
}

/* KPI Cards */
.metrics-row {
  margin-bottom: 2px;
}

.metric-card {
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  background-color: var(--el-bg-color);

  :deep(.el-card__body) {
    padding: 16px 18px;
  }
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  font-family: var(--font-sans);

  &.status-text {
    font-size: 1.1rem;
    color: var(--status-active);
  }
}

.metric-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.metric-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;

  &.blue {
    background-color: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }
  &.emerald {
    background-color: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }
  &.violet {
    background-color: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;
  }
  &.green {
    background-color: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }
}

/* Toolbar */
.toolbar-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 12px 18px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.search-kbd-wrap {
  margin-right: 4px;
}

.search-kbd {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-family: var(--font-mono);
  line-height: 16px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
  user-select: none;
  transition: all 0.15s ease;

  &.esc {
    cursor: pointer;
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    border-color: var(--el-color-danger-light-7);

    &:hover {
      background-color: var(--el-color-danger);
      color: #ffffff;
    }
  }
}

.toolbar-right {
  gap: 14px;
}

.count-badge {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.view-mode-group {
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 2px;
  border: 1px solid var(--surface-border);
}

.view-btn {
  border: none;
  background: transparent;
  width: 30px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    color: var(--el-text-color-primary);
  }

  &.active {
    background-color: var(--el-bg-color);
    color: var(--el-color-primary);
    box-shadow: var(--surface-shadow-sm);
  }
}

/* Empty Container */
.empty-container {
  padding: 30px 0;
}

.empty-card {
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: var(--el-fill-color-light);
  margin: 0 auto 16px auto;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 0.88rem;
  color: var(--el-text-color-secondary);
  max-width: 440px;
  margin: 0 auto 20px auto;
  line-height: 1.6;
}

/* App Grid View */
.grid-col {
  margin-bottom: 18px;
}

.app-item-card {
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  background-color: var(--el-bg-color);
  position: relative;
  overflow: hidden;

  &.is-interactive {
    cursor: pointer;
    outline: none;

    &:focus-visible {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--surface-shadow-hover);
    border-color: var(--el-color-primary-light-5);
  }

  :deep(.el-card__body) {
    padding: 18px;
  }
}

.card-head {
  margin-bottom: 14px;
  align-items: flex-start;
}

.app-main-info {
  gap: 12px;
  min-width: 0;
}

.app-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.app-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-right: 10px;
}

.app-text-info {
  min-width: 0;
}

.app-title-link {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 190px;
  transition: color 0.18s ease;

  &:hover {
    color: var(--el-color-primary);
  }
}

.app-id-pill {
  margin-top: 4px;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.id-label {
  font-weight: 600;
  color: var(--el-text-color-placeholder);
}

.id-code {
  font-family: var(--font-mono);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn,
.copy-btn-sm {
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--el-fill-color);
    color: var(--el-color-primary);
  }
}

.more-btn {
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }
}

/* Platform Chips */
.card-platforms {
  gap: 6px;
  margin-bottom: 14px;
}

.platform-chip {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  border: 1px solid var(--surface-border);

  &.interactive {
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      filter: brightness(0.95);
      transform: scale(1.04);
    }
  }

  &.android {
    background-color: rgba(16, 185, 129, 0.08);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.2);
  }

  &.ios {
    background-color: rgba(59, 130, 246, 0.08);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.2);
  }
}

/* Card Stats Grid */
.card-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background-color: var(--el-fill-color-lighter);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.stat-box {
  display: flex;
  flex-direction: column;
}

.stat-box-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 3px;
}

.stat-box-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &.code-font {
    font-family: var(--font-mono);
  }
}

.empty-patch-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: normal;
}

/* Card Footer */
.card-footer {
  padding-top: 8px;
  border-top: 1px solid var(--surface-border);
}

.update-time-text {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* Dense Table */
.table-card {
  border-radius: 12px;
}

.table-app-cell {
  padding: 4px 0;
}

.app-name-link {
  font-weight: 600;
  font-size: 14px;
}

.text-muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* CLI Guide Card */
.cli-guide-card {
  border-radius: 12px;
  background: linear-gradient(180deg, var(--el-fill-color-lighter) 0%, var(--el-bg-color) 100%);
  border: 1px solid var(--surface-border);

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.cli-guide-header {
  margin-bottom: 12px;
}

.cli-guide-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.cli-steps {
  gap: 12px;
  flex-wrap: wrap;
}

.cli-step-box {
  flex: 1;
  min-width: 200px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-num {
  font-size: 10px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.step-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.step-code {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
  padding: 3px 6px;
  border-radius: 4px;
  width: fit-content;
}

.step-arrow {
  color: var(--el-text-color-placeholder);
}

/* Dialog styling */
.yaml-dialog-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 0;
  margin-bottom: 12px;

  code {
    font-family: var(--font-mono);
    color: var(--el-color-primary);
  }
}

.yaml-snippet-wrap {
  background-color: var(--el-fill-color-darker);
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid var(--surface-border);
}

.yaml-snippet {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
}
</style>
