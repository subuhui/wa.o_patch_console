<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { z } from 'zod'
import { Cpu, Key } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const tokenForm = ref({
  token: '',
})

const tokenSchema = z.object({
  token: z.string().min(1, '请输入 Shorebird Private Server 鉴权 Token'),
})

const loading = ref(false)

async function handleLogin() {
  const result = tokenSchema.safeParse(tokenForm.value)
  if (!result.success) {
    ElMessage.warning(result.error.issues[0].message)
    return
  }

  loading.value = true
  try {
    authStore.setToken(tokenForm.value.token.trim())
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/apps'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper flex-center">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header flex-center">
          <el-icon :size="32" color="#409EFF"><Cpu /></el-icon>
          <span class="card-title">Shorebird Console</span>
        </div>
      </template>

      <p class="login-subtitle">连接至您的 Shorebird 私有热更新服务器</p>

      <el-form :model="tokenForm" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="tokenForm.token"
            placeholder="请输入服务私有访问 Token (REPLACE_WITH_PRIVATE_TOKEN)"
            type="password"
            show-password
            size="large"
            :prefix-icon="Key"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >
            进入控制台
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-wrapper {
  height: 100vh;
  width: 100vw;
  background-color: var(--el-bg-color-page);
}

.login-card {
  width: 440px;
  max-width: 90%;
  border-radius: 12px;
}

.card-header {
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
}

.login-subtitle {
  text-align: center;
  color: var(--el-text-color-secondary);
  margin-bottom: 24px;
  font-size: 0.9rem;
}

.submit-btn {
  width: 100%;
}
</style>
