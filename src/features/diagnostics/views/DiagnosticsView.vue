<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'
import { Odometer, Download, Upload, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const testingDownload = ref(false)
const testingUpload = ref(false)
const downloadSpeed = ref<string | null>(null)
const uploadSpeed = ref<string | null>(null)

async function testDownload() {
  testingDownload.value = true
  downloadSpeed.value = null
  const startTime = performance.now()
  try {
    const res = await apiClient.get('/diagnostics/gcp_download')
    const downloadUrl = res.data.url
    // Fetch test payload
    const testRes = await fetch(downloadUrl)
    const blob = await testRes.blob()
    const endTime = performance.now()
    const durationSec = (endTime - startTime) / 1000
    const sizeMb = blob.size / (1024 * 1024)
    const speedMbps = ((sizeMb * 8) / durationSec).toFixed(2)
    downloadSpeed.value = `${speedMbps} Mbps (${sizeMb.toFixed(1)} MB / ${durationSec.toFixed(2)}s)`
    ElMessage.success('下载测速完成')
  } catch {
    downloadSpeed.value = '测速失败 (服务不可达或未配置 PublicURL)'
  } finally {
    testingDownload.value = false
  }
}

async function testUpload() {
  testingUpload.value = true
  uploadSpeed.value = null
  const startTime = performance.now()
  try {
    const res = await apiClient.get('/diagnostics/gcp_upload')
    const uploadUrl = res.data.url
    // Create 5MB mock payload
    const mockData = new Uint8Array(5 * 1024 * 1024)
    const formData = new FormData()
    formData.append('file', new Blob([mockData]))

    await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    const endTime = performance.now()
    const durationSec = (endTime - startTime) / 1000
    const speedMbps = ((5 * 8) / durationSec).toFixed(2)
    uploadSpeed.value = `${speedMbps} Mbps (5 MB / ${durationSec.toFixed(2)}s)`
    ElMessage.success('上传测速完成')
  } catch {
    uploadSpeed.value = '测速失败 (服务不可达或未配置 PublicURL)'
  } finally {
    testingUpload.value = false
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
              <el-icon :size="20" color="#409EFF"><Download /></el-icon>
              <span>下行测速 (Download Speed)</span>
            </div>
          </template>

          <p class="card-desc">
            从服务器 PublicURL 诊断接口请求测试数据包（16MB），评估客户端获取底包及补丁的下行速率。
          </p>

          <div v-if="downloadSpeed" class="speed-result">
            <el-icon color="#67C23A" :size="18"><CircleCheck /></el-icon>
            <strong>{{ downloadSpeed }}</strong>
          </div>

          <el-button
            type="primary"
            :icon="Odometer"
            :loading="testingDownload"
            @click="testDownload"
          >
            开始下载测速
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-card shadow="never" class="diag-card">
          <template #header>
            <div class="card-title flex-center">
              <el-icon :size="20" color="#67C23A"><Upload /></el-icon>
              <span>上行测速 (Upload Speed)</span>
            </div>
          </template>

          <p class="card-desc">
            向服务器上传临时测试数据（5MB），评估开发者通过 CLI 推送补丁与 Release 产物的上传速率。
          </p>

          <div v-if="uploadSpeed" class="speed-result">
            <el-icon color="#67C23A" :size="18"><CircleCheck /></el-icon>
            <strong>{{ uploadSpeed }}</strong>
          </div>

          <el-button type="success" :icon="Odometer" :loading="testingUpload" @click="testUpload">
            开始上传测速
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.diagnostics-page {
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

.diag-card {
  border-radius: 8px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 1rem;
}
</style>
