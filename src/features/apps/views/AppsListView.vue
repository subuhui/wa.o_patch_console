<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'
import { Plus, Edit, Delete, Files, Cpu } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { z } from 'zod'

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

// Fetch apps
const { data, isLoading } = useQuery<{ apps: AppMetadata[] }>({
  queryKey: ['apps'],
  queryFn: async () => {
    const res = await apiClient.get('/apps')
    return res.data
  },
})

// Dialog state
const createDialogVisible = ref(false)
const appForm = ref({
  displayName: '',
})

const appSchema = z.object({
  displayName: z.string().min(2, '应用名称至少包含 2 个字符'),
})

// Create app mutation
const createMutation = useMutation({
  mutationFn: (newApp: { display_name: string }) => apiClient.post('/apps', newApp),
  onSuccess: () => {
    ElMessage.success('应用创建成功')
    createDialogVisible.value = false
    appForm.value.displayName = ''
    queryClient.invalidateQueries({ queryKey: ['apps'] })
  },
})

function handleCreate() {
  const result = appSchema.safeParse(appForm.value)
  if (!result.success) {
    ElMessage.warning(result.error.issues[0].message)
    return
  }
  createMutation.mutate({ display_name: appForm.value.displayName.trim() })
}

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
      await apiClient.patch(`/apps/${app.app_id}`, { display_name: value.trim() })
      ElMessage.success('重命名成功')
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    }
  } catch {
    // cancelled
  }
}

// Delete app
async function handleDelete(app: AppMetadata) {
  try {
    await ElMessageBox.confirm(
      `确定要删除应用 "${app.display_name}" (${app.app_id}) 吗？此操作无法撤销！`,
      '危险警告',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
      },
    )
    await apiClient.delete(`/apps/${app.app_id}`)
    ElMessage.success('应用已删除')
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
</script>

<template>
  <div class="apps-page">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">应用列表</h2>
        <p class="page-desc">管理私有热更新服务器中登记的所有应用与版本发布状态</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="createDialogVisible = true">
        新建应用
      </el-button>
    </div>

    <el-card v-loading="isLoading" shadow="never" class="table-card">
      <el-table :data="data?.apps || []" stripe style="width: 100%">
        <el-table-column prop="display_name" label="应用名称" min-width="180">
          <template #default="{ row }">
            <el-link
              type="primary"
              :underline="false"
              class="app-name-link"
              @click="selectApp(row.app_id)"
            >
              {{ row.display_name }}
            </el-link>
            <div class="app-id-text">ID: {{ row.app_id }}</div>
          </template>
        </el-table-column>

        <el-table-column label="支持平台" width="160">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="platform in row.platforms" :key="platform" size="small" effect="plain">
                {{ platform }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column prop="latest_release_version" label="最新底包版本" width="160">
          <template #default="{ row }">
            <span>{{ row.latest_release_version || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="latest_patch_number" label="最新补丁号" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.latest_patch_number" size="small" type="success">
              #{{ row.latest_patch_number }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="最后更新时间" width="200">
          <template #default="{ row }">
            {{ row.updated_at ? new Date(row.updated_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Files" @click="selectApp(row.app_id)">
              版本
            </el-button>
            <el-button link type="primary" :icon="Cpu" @click="goToPatches(row.app_id)">
              补丁
            </el-button>
            <el-button link type="warning" :icon="Edit" @click="handleRename(row)">
              改名
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create App Dialog -->
    <el-dialog v-model="createDialogVisible" title="新建应用" width="480px" destroy-on-close>
      <el-form :model="appForm" label-position="top">
        <el-form-item label="应用显示名称" required>
          <el-input
            v-model="appForm.displayName"
            placeholder="例如: Shorebird Flutter Client"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createMutation.isPending.value" @click="handleCreate">
          立即创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.apps-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.page-desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.table-card {
  border-radius: 8px;
}

.app-name-link {
  font-weight: 600;
  font-size: 1rem;
}

.app-id-text {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
