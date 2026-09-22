<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import apiClient from '@/api/client'
import { Plus, ArrowLeft, Cpu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Release {
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

interface ReleaseArtifact {
  id: number
  release_id: number
  arch: string
  platform: string
  hash: string
  size: number
  url: string
  can_sideload: boolean
}

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const appId = computed(() => route.params.appId as string)

// Fetch Releases
const { data, isLoading } = useQuery<{ releases: Release[] }>({
  queryKey: ['releases', appId],
  queryFn: async () => {
    const res = await apiClient.get(`/apps/${appId.value}/releases`)
    return res.data
  },
  enabled: computed(() => Boolean(appId.value)),
})

// Dialog & Drawer state
const createDialogVisible = ref(false)
const artifactsDrawerVisible = ref(false)
const selectedRelease = ref<Release | null>(null)
const artifacts = ref<ReleaseArtifact[]>([])
const artifactsLoading = ref(false)

const releaseForm = ref({
  version: '',
  flutter_revision: '',
  flutter_version: '',
})

// Create Release mutation
const createMutation = useMutation({
  mutationFn: (newRelease: typeof releaseForm.value) =>
    apiClient.post(`/apps/${appId.value}/releases`, newRelease),
  onSuccess: () => {
    ElMessage.success('Release 创建成功')
    createDialogVisible.value = false
    releaseForm.value = { version: '', flutter_revision: '', flutter_version: '' }
    queryClient.invalidateQueries({ queryKey: ['releases', appId] })
  },
})

function handleCreate() {
  if (!releaseForm.value.version || !releaseForm.value.flutter_revision) {
    ElMessage.warning('版本号与 Flutter Revision 为必填项')
    return
  }
  createMutation.mutate(releaseForm.value)
}

async function viewArtifacts(release: Release) {
  selectedRelease.value = release
  artifactsDrawerVisible.value = true
  artifactsLoading.value = true
  try {
    const res = await apiClient.get(`/apps/${appId.value}/releases/${release.id}/artifacts`)
    artifacts.value = res.data.artifacts || []
  } finally {
    artifactsLoading.value = false
  }
}

function goToPatches() {
  router.push({ name: 'patches', params: { appId: appId.value } })
}

function goToReleasePatches(relId: number) {
  router.push({
    name: 'patches',
    params: { appId: appId.value },
    query: { releaseId: relId },
  })
}
</script>

<template>
  <div class="releases-page">
    <div class="page-header flex-between">
      <div class="header-info flex-center">
        <el-button link :icon="ArrowLeft" @click="router.push({ name: 'apps' })">
          返回应用
        </el-button>
        <el-divider direction="vertical" />
        <div>
          <h2 class="page-title">底包版本发布 (Releases)</h2>
          <span class="page-desc"
            >应用: <strong>{{ appId }}</strong></span
          >
        </div>
      </div>
      <div class="actions">
        <el-button :icon="Cpu" @click="goToPatches">查看补丁</el-button>
        <el-button type="primary" :icon="Plus" @click="createDialogVisible = true">
          新建 Release
        </el-button>
      </div>
    </div>

    <el-card v-loading="isLoading" shadow="never" class="table-card">
      <el-table :data="data?.releases || []" stripe style="width: 100%">
        <el-table-column prop="version" label="底包版本" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.version }}</strong>
            <div v-if="row.display_name" class="sub-text">{{ row.display_name }}</div>
          </template>
        </el-table-column>

        <el-table-column label="平台发布状态" min-width="200">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag
                v-for="(status, platform) in row.platform_statuses"
                :key="platform"
                :type="status === 'active' ? 'success' : 'info'"
                size="small"
              >
                {{ platform }}: {{ status }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column prop="flutter_version" label="Flutter 版本" width="140">
          <template #default="{ row }">
            {{ row.flutter_version || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="flutter_revision" label="Flutter 引擎 Revision" min-width="180">
          <template #default="{ row }">
            <el-text class="code-text" truncated>{{ row.flutter_revision }}</el-text>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Cpu" @click="goToReleasePatches(row.id)">
              查看补丁
            </el-button>
            <el-button link type="primary" @click="viewArtifacts(row as Release)">
              产物详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create Release Dialog -->
    <el-dialog v-model="createDialogVisible" title="新建 Release 版本" width="500px">
      <el-form :model="releaseForm" label-position="top">
        <el-form-item label="版本号 (如 1.0.0+1)" required>
          <el-input v-model="releaseForm.version" placeholder="1.0.0+1" />
        </el-form-item>
        <el-form-item label="Flutter Engine Revision" required>
          <el-input
            v-model="releaseForm.flutter_revision"
            placeholder="如: c6d2c4990d4081c7e937d5830b91e920d32b4b45"
          />
        </el-form-item>
        <el-form-item label="Flutter SDK 版本 (可选)">
          <el-input v-model="releaseForm.flutter_version" placeholder="如: 3.29.0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createMutation.isPending.value" @click="handleCreate">
          确定创建
        </el-button>
      </template>
    </el-dialog>

    <!-- Artifacts Drawer -->
    <el-drawer
      v-model="artifactsDrawerVisible"
      :title="`Release ${selectedRelease?.version} 底包产物列表`"
      size="550px"
    >
      <div v-loading="artifactsLoading">
        <el-empty v-if="artifacts.length === 0" description="暂无产物记录" />
        <el-table v-else :data="artifacts" stripe>
          <el-table-column prop="platform" label="平台" width="100" />
          <el-table-column prop="arch" label="架构" width="110" />
          <el-table-column label="文件大小" width="110">
            <template #default="{ row }"> {{ (row.size / 1024 / 1024).toFixed(2) }} MB </template>
          </el-table-column>
          <el-table-column label="下载" min-width="100">
            <template #default="{ row }">
              <el-link :href="row.url" target="_blank" type="primary">下载产物</el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.releases-page {
  max-width: 1200px;
  margin: 0 auto;
}

.releases-page {
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.header-info {
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.table-card {
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.sub-text {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

.code-text {
  font-family: var(--font-mono);
  font-size: 12px;
  background-color: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
