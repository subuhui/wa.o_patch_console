<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'
import { Odometer, Download, Upload, CircleCheck, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const testingDownload = ref(false)
const testingUpload = ref(false)
const downloadStatus = ref('')
const uploadStatus = ref('')
const downloadSpeed = ref<string | null>(null)
const uploadSpeed = ref<string | null>(null)
const downloadError = ref<string | null>(null)
const uploadError = ref<string | null>(null)

async function testDownload() {
  testingDownload.value = true
  downloadSpeed.value = null
  downloadError.value = null
  downloadStatus.value = '正在解析集群下行端点...'
  const startTime = performance.now()
  try {
    const res = await apiClient.get('/diagnostics/gcp_download')
    let downloadUrl = res.data.download_url || res.data.url
    if (!downloadUrl) throw new Error('No download URL returned')
    try {
      const parsed = new URL(downloadUrl, window.location.origin)
      if (parsed.pathname.startsWith('/api/')) {
        downloadUrl = parsed.pathname + parsed.search
      }
    } catch {
      // ignore parse error, fallback to raw url
    }
    downloadStatus.value = '正在流式传输 16MB 样本数据...'
    // Fetch test payload
    const testRes = await fetch(downloadUrl)
    const blob = await testRes.blob()
    downloadStatus.value = '正在统计吞吐速率...'
    const endTime = performance.now()
    const durationSec = (endTime - startTime) / 1000
    const sizeMb = blob.size / (1024 * 1024)
    const speedMbps = ((sizeMb * 8) / durationSec).toFixed(2)
    downloadSpeed.value = `${speedMbps} Mbps (${sizeMb.toFixed(1)} MB / ${durationSec.toFixed(2)}s)`
    ElMessage.success('下载测速完成')
  } catch {
    downloadError.value = '测速失败 (服务不可达或未配置 PublicURL)'
  } finally {
    testingDownload.value = false
    downloadStatus.value = ''
  }
}

async function testUpload() {
  testingUpload.value = true
  uploadSpeed.value = null
  uploadError.value = null
  uploadStatus.value = '正在解析集群上行端点...'
  const startTime = performance.now()
  try {
    const res = await apiClient.get('/diagnostics/gcp_upload')
    let uploadUrl = res.data.upload_url || res.data.url
    if (!uploadUrl) throw new Error('No upload URL returned')
    try {
      const parsed = new URL(uploadUrl, window.location.origin)
      if (parsed.pathname.startsWith('/api/')) {
        uploadUrl = parsed.pathname + parsed.search
      }
    } catch {
      // ignore parse error, fallback to raw url
    }
    uploadStatus.value = '正在封装 5MB 诊断载荷并推送...'
    // Server expects exactly 5,000,000 bytes
    const mockData = new Uint8Array(5000000)
    const formData = new FormData()
    formData.append('file', new Blob([mockData]), 'diagnostics.bin')

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}`)
    }
    uploadStatus.value = '正在统计上行吞吐指标...'
    const endTime = performance.now()
    const durationSec = (endTime - startTime) / 1000
    const sizeMb = 5000000 / (1024 * 1024)
    const speedMbps = ((sizeMb * 8) / durationSec).toFixed(2)
    uploadSpeed.value = `${speedMbps} Mbps (${sizeMb.toFixed(1)} MB / ${durationSec.toFixed(2)}s)`
    ElMessage.success('上传测速完成')
  } catch {
    uploadError.value = '测速失败 (服务不可达或未配置 PublicURL)'
  } finally {
    testingUpload.value = false
    uploadStatus.value = ''
  }
}
</script>

<template>
  <div class="diagnostics-page">
    <div class="page-header">
      <h2 class="page-title">系统测速与网络诊断</h2>
      <p class="page-desc">测试客户端与 Shorebird 私有补丁服务器之间的文件传输吞吐量与连接延迟</p>
    </div>

    <el-row :gutter="24">
      <el-col :xs="24" :sm="12">
        <el-card shadow="never" class="diag-card">
          <template #header>
            <div class="card-title flex-center">
              <el-icon :size="20" color="#3b82f6"><Download /></el-icon>
              <span>下行测速 (Download Speed)</span>
            </div>
          </template>

          <p class="card-desc">
            从服务器 PublicURL 诊断接口请求测试数据包（16MB），评估客户端获取底包及补丁的下行速率。
          </p>

          <!-- Testing Progress -->
          <div v-if="testingDownload" class="test-progress-box">
            <div class="progress-label flex-between">
              <span>{{ downloadStatus }}</span>
              <span class="pulse-text">测速中...</span>
            </div>
            <el-progress :percentage="100" :indeterminate="true" :duration="2" :show-text="false" />
          </div>

          <!-- Speed Result -->
          <div v-if="downloadSpeed" class="speed-result flex-between">
            <div class="flex-start" style="gap: 10px">
              <el-icon color="#10b981" :size="22"><CircleCheck /></el-icon>
              <div>
                <div class="speed-val code-font">{{ downloadSpeed }}</div>
                <div class="speed-desc">下行带宽测速完成</div>
              </div>
            </div>
            <el-tag type="success" effect="light" round size="small">在线畅通</el-tag>
          </div>

          <!-- Error Alert -->
          <div v-if="downloadError" class="speed-error flex-start">
            <el-icon color="#f43f5e" :size="18"><Warning /></el-icon>
            <span>{{ downloadError }}</span>
          </div>

          <el-button
            type="primary"
            :icon="Odometer"
            :loading="testingDownload"
            @click="testDownload"
          >
            {{ testingDownload ? '正在测速中...' : '开始下载测速' }}
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-card shadow="never" class="diag-card">
          <template #header>
            <div class="card-title flex-center">
              <el-icon :size="20" color="#10b981"><Upload /></el-icon>
              <span>上行测速 (Upload Speed)</span>
            </div>
          </template>

          <p class="card-desc">
            向服务器上传临时测试数据（5MB），评估开发者通过 CLI 推送补丁与 Release 产物的上传速率。
          </p>

          <!-- Testing Progress -->
          <div v-if="testingUpload" class="test-progress-box">
            <div class="progress-label flex-between">
              <span>{{ uploadStatus }}</span>
              <span class="pulse-text">测速中...</span>
            </div>
            <el-progress
              :percentage="100"
              :indeterminate="true"
              :duration="2"
              :show-text="false"
              status="success"
            />
          </div>

          <!-- Speed Result -->
          <div v-if="uploadSpeed" class="speed-result flex-between">
            <div class="flex-start" style="gap: 10px">
              <el-icon color="#10b981" :size="22"><CircleCheck /></el-icon>
              <div>
                <div class="speed-val code-font">{{ uploadSpeed }}</div>
                <div class="speed-desc">上行带宽测速完成</div>
              </div>
            </div>
            <el-tag type="success" effect="light" round size="small">在线畅通</el-tag>
          </div>

          <!-- Error Alert -->
          <div v-if="uploadError" class="speed-error flex-start">
            <el-icon color="#f43f5e" :size="18"><Warning /></el-icon>
            <span>{{ uploadError }}</span>
          </div>

          <el-button type="success" :icon="Odometer" :loading="testingUpload" @click="testUpload">
            {{ testingUpload ? '正在测速中...' : '开始上传测速' }}
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.diagnostics-page {
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.page-desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.diag-card {
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  margin-bottom: 20px;
}

.card-title {
  gap: 8px;
  font-weight: 600;
  justify-content: flex-start;
}

.card-desc {
  color: var(--el-text-color-secondary);
  font-size: 0.88rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.speed-result {
  margin-bottom: 20px;
  padding: 14px 18px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
}

.speed-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-family: var(--font-mono);
}

.speed-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.test-progress-box {
  background-color: var(--el-fill-color-lighter);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.progress-label {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  font-weight: 500;
}

.pulse-text {
  font-size: 11px;
  color: var(--el-color-primary);
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

.speed-error {
  margin-bottom: 20px;
  padding: 12px 16px;
  background-color: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: 8px;
  color: #f43f5e;
  font-size: 13px;
  gap: 8px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
