<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { z } from 'zod'
import { Key } from '@element-plus/icons-vue'

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
    <div class="ambient-glow" />
    <el-card class="login-card" shadow="never">
      <template #header>
        <div class="card-header flex-center">
          <div class="brand-badge flex-center">
            <svg
              class="shorebird-svg"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 13.5L12 4.5L21 13.5L18 19.5L12 16.5L6 19.5L3 13.5Z"
                fill="url(#login-sb-gradient)"
              />
              <defs>
                <linearGradient
                  id="login-sb-gradient"
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
          <div class="brand-text">
            <span class="card-title">Shorebird</span>
            <span class="badge-tag">CONSOLE</span>
          </div>
        </div>
      </template>

      <p class="login-subtitle">连接至您的 Shorebird 私有热更新服务器集群</p>

      <el-form :model="tokenForm" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="tokenForm.token"
            placeholder="请输入服务鉴权 Token"
            type="password"
            show-password
            size="large"
            :prefix-icon="Key"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <div class="token-helper flex-between">
            <span class="token-hint"
              >默认测试 Token: <code>sb_api_private_shorebird_token</code></span
            >
            <el-button
              link
              type="primary"
              size="small"
              @click="tokenForm.token = 'sb_api_private_shorebird_token'"
            >
              一键填入
            </el-button>
          </div>
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
  position: relative;
  overflow: hidden;
}

.ambient-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.15) 0%,
    rgba(99, 102, 241, 0.05) 50%,
    transparent 70%
  );
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.login-card {
  width: 440px;
  max-width: 90%;
  border-radius: 16px;
  border: 1px solid var(--surface-border);
  background-color: var(--el-bg-color);
  box-shadow: var(--surface-shadow);
  position: relative;
  z-index: 1;

  :deep(.el-card__header) {
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid var(--surface-border);
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.card-header {
  gap: 12px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12));
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.shorebird-svg {
  width: 26px;
  height: 26px;
}

.brand-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.badge-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 999px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-7);
}

.login-subtitle {
  text-align: center;
  color: var(--el-text-color-secondary);
  margin-bottom: 24px;
  font-size: 0.9rem;
}

.token-helper {
  width: 100%;
  margin-bottom: 16px;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.token-helper code {
  background-color: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--el-color-primary);
}

.submit-btn {
  width: 100%;
  border-radius: 8px;
  font-weight: 600;
  height: 44px;
}
</style>
