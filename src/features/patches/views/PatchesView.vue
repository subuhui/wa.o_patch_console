<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import apiClient from '@/api/client'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  ArrowLeft,
  RefreshRight,
  Check,
  Back,
  Plus,
  Delete,
  Operation,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface PatchArtifact {
  id: number
  patch_id: number
  arch: string
  platform: string
  hash: string
  size: number
  created_at: string
}

interface ReleasePatch {
  id: number
  number: number
  channel?: string | null
  artifacts: PatchArtifact[]
  is_rolled_back: boolean
}

interface Release {
  id: number
  version: string
  display_name?: string | null
}

interface Channel {
  id: number
  name: string
}

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const appId = computed(() => route.params.appId as string)

// Fetch releases for this app to populate selector
const { data: releasesData } = useQuery<{ releases: Release[] }>({
  queryKey: ['releases', appId],
  queryFn: async () => {
    const res = await apiClient.get(`/apps/${appId.value}/releases`)
    return res.data
  },
  enabled: computed(() => Boolean(appId.value)),
})

const releaseId = ref<number | null>(route.query.releaseId ? Number(route.query.releaseId) : null)

// Default to first release when releases load if not set
watch(
  () => releasesData.value?.releases,
  newReleases => {
    if (newReleases && newReleases.length > 0 && !releaseId.value) {
      releaseId.value = newReleases[0].id
    }
  },
  { immediate: true },
)

// Fetch channels for this app
const { data: channelsData } = useQuery<Channel[]>({
  queryKey: ['channels', appId],
  queryFn: async () => {
    const res = await apiClient.get(`/apps/${appId.value}/channels`)
    return res.data
  },
  enabled: computed(() => Boolean(appId.value)),
})

// Fetch patches for release
const { data: patchesData, isLoading } = useQuery<{ patches: ReleasePatch[] }>({
  queryKey: ['patches', appId, releaseId],
  queryFn: async () => {
    if (!releaseId.value) return { patches: [] }
    const res = await apiClient.get(`/apps/${appId.value}/releases/${releaseId.value}/patches`)
    return res.data
  },
  enabled: computed(() => Boolean(appId.value && releaseId.value)),
})

// Channel Management Drawer
const channelDrawerVisible = ref(false)
const newChannelName = ref('')

const createChannelMutation = useMutation({
  mutationFn: (channel: string) => apiClient.post(`/apps/${appId.value}/channels`, { channel }),
  onSuccess: () => {
    ElMessage.success('渠道创建成功')
    newChannelName.value = ''
    queryClient.invalidateQueries({ queryKey: ['channels', appId] })
  },
})

function handleCreateChannel() {
  const name = newChannelName.value.trim()
  if (!name) {
    ElMessage.warning('请输入渠道名称')
    return
  }
  createChannelMutation.mutate(name)
}

async function handleDeleteChannel(channel: Channel) {
  const builtinChannels = ['stable', 'beta', 'staging']
  if (builtinChannels.includes(channel.name.toLowerCase())) {
    ElMessage.error(`内置渠道 "${channel.name}" 不允许删除`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除自定义渠道 "${channel.name}" 吗？删除后关联的补丁将解除渠道关联。`,
      '删除渠道',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await apiClient.delete(`/apps/${appId.value}/channels/${channel.id}`)
    ElMessage.success('渠道已删除')
    queryClient.invalidateQueries({ queryKey: ['channels', appId] })
  } catch {
    // cancelled
  }
}

// Promote Dialog
const promoteDialogVisible = ref(false)
const selectedPatch = ref<ReleasePatch | null>(null)
const targetChannelId = ref<number | null>(null)

const promoteMutation = useMutation({
  mutationFn: (payload: { patch_id: number; channel_id: number }) =>
    apiClient.post(`/apps/${appId.value}/patches/promote`, payload),
  onSuccess: () => {
    ElMessage.success('补丁发布/升级成功')
    promoteDialogVisible.value = false
    queryClient.invalidateQueries({ queryKey: ['patches', appId, releaseId] })
  },
})

function openPromoteDialog(patch: ReleasePatch) {
  selectedPatch.value = patch
  targetChannelId.value = null
  promoteDialogVisible.value = true
}

function handlePromote() {
  if (!selectedPatch.value || !targetChannelId.value) {
    ElMessage.warning('请选择要发布到的渠道')
    return
  }
  promoteMutation.mutate({
    patch_id: selectedPatch.value.id,
    channel_id: targetChannelId.value,
  })
}

// Rollback patch
async function handleRollback(patch: ReleasePatch) {
  try {
    await ElMessageBox.confirm(
      `确定要回滚补丁 #${patch.number} 吗？回滚后客户端将不再接收此补丁。`,
      '补丁回滚',
      {
        confirmButtonText: '确定回滚',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await apiClient.post(`/apps/${appId.value}/patches/${patch.id}/rollback`, {
      release_id: String(releaseId.value),
      patch_id: String(patch.id),
    })
    ElMessage.success(`补丁 #${patch.number} 已成功回滚`)
    queryClient.invalidateQueries({ queryKey: ['patches', appId, releaseId] })
  } catch {
    // cancelled
  }
}

// Rollforward patch
async function handleRollforward(patch: ReleasePatch) {
  try {
    await ElMessageBox.confirm(`确定要恢复补丁 #${patch.number} (Rollforward) 吗？`, '恢复补丁', {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      type: 'info',
    })
    await apiClient.post(
      `/apps/${appId.value}/releases/${releaseId.value}/patches/${patch.id}/rollforward`,
    )
    ElMessage.success(`补丁 #${patch.number} 已重新激活`)
    queryClient.invalidateQueries({ queryKey: ['patches', appId, releaseId] })
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="patches-page">
    <div class="page-header flex-between">
      <div class="header-info flex-center">
        <el-button
          link
          :icon="ArrowLeft"
          @click="router.push({ name: 'releases', params: { appId } })"
        >
          返回版本
        </el-button>
        <el-divider direction="vertical" />
        <div>
          <h2 class="page-title">热更新补丁管理 (Patches)</h2>
          <span class="page-desc"
            >应用: <strong>{{ appId }}</strong></span
          >
        </div>
      </div>

      <div class="header-actions flex-center">
        <el-button :icon="Operation" @click="channelDrawerVisible = true"> 渠道管理 </el-button>

        <!-- Release selector -->
        <el-select v-model="releaseId" placeholder="选择 Release 版本" style="width: 200px">
          <el-option
            v-for="rel in releasesData?.releases || []"
            :key="rel.id"
            :label="`${rel.version} (ID: ${rel.id})`"
            :value="rel.id"
          />
        </el-select>
      </div>
    </div>

    <el-card v-loading="isLoading" shadow="never" class="table-card">
      <el-empty
        v-if="!patchesData?.patches || patchesData.patches.length === 0"
        description="当前版本暂无补丁记录"
      />
      <el-table v-else :data="patchesData.patches" stripe style="width: 100%">
        <el-table-column prop="number" label="补丁编号" width="120">
          <template #default="{ row }">
            <strong>#{{ row.number }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="channel" label="当前生效渠道" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.channel" type="primary" effect="plain">
              {{ row.channel }}
            </el-tag>
            <span v-else class="text-muted">草稿 (未激活)</span>
          </template>
        </el-table-column>

        <el-table-column label="运行状态" width="140">
          <template #default="{ row }">
            <StatusTag
              :status="row.is_rolled_back ? 'rolled_back' : row.channel ? 'active' : 'draft'"
            />
          </template>
        </el-table-column>

        <el-table-column label="补丁包含产物" min-width="200">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag
                v-for="artifact in row.artifacts"
                :key="artifact.id"
                size="small"
                type="info"
                effect="plain"
              >
                {{ artifact.platform }} ({{ artifact.arch }}):
                {{ (artifact.size / 1024).toFixed(1) }} KB
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Check"
              @click="openPromoteDialog(row as ReleasePatch)"
            >
              发布/切换渠道
            </el-button>

            <el-button
              v-if="!row.is_rolled_back"
              link
              type="warning"
              :icon="Back"
              @click="handleRollback(row as ReleasePatch)"
            >
              回滚
            </el-button>

            <el-button
              v-else
              link
              type="success"
              :icon="RefreshRight"
              @click="handleRollforward(row as ReleasePatch)"
            >
              重新激活
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Promote Dialog -->
    <el-dialog v-model="promoteDialogVisible" title="发布补丁到目标渠道 (Promote)" width="480px">
      <el-form label-position="top">
        <el-form-item label="当前补丁">
          <strong>#{{ selectedPatch?.number }} (ID: {{ selectedPatch?.id }})</strong>
        </el-form-item>
        <el-form-item label="选择目标渠道" required>
          <el-select
            v-model="targetChannelId"
            placeholder="请选择渠道 (如 stable, beta, staging)"
            style="width: 100%"
          >
            <el-option
              v-for="ch in channelsData || []"
              :key="ch.id"
              :label="ch.name"
              :value="ch.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="promoteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="promoteMutation.isPending.value" @click="handlePromote">
          确定发布
        </el-button>
      </template>
    </el-dialog>

    <!-- Channel Management Drawer -->
    <el-drawer v-model="channelDrawerVisible" title="应用渠道管理 (Channels)" size="480px">
      <div class="channel-manage">
        <div class="channel-create flex-between">
          <el-input
            v-model="newChannelName"
            placeholder="输入新渠道名 (例如 canary)"
            style="flex: 1; margin-right: 12px"
          />
          <el-button
            type="primary"
            :icon="Plus"
            :loading="createChannelMutation.isPending.value"
            @click="handleCreateChannel"
          >
            新增
          </el-button>
        </div>

        <el-divider />

        <el-table :data="channelsData || []" stripe>
          <el-table-column prop="name" label="渠道名称">
            <template #default="{ row }">
              <strong>{{ row.name }}</strong>
              <el-tag
                v-if="['stable', 'beta', 'staging'].includes(row.name.toLowerCase())"
                size="small"
                type="info"
                style="margin-left: 8px"
              >
                内置
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                v-if="!['stable', 'beta', 'staging'].includes(row.name.toLowerCase())"
                link
                type="danger"
                :icon="Delete"
                @click="handleDeleteChannel(row as Channel)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.patches-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-info {
  gap: 8px;
}

.header-actions {
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.page-desc {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}

.table-card {
  border-radius: 8px;
}

.text-muted {
  color: var(--el-text-color-secondary);
  font-size: 0.85rem;
}

.channel-create {
  margin-bottom: 16px;
}
</style>
