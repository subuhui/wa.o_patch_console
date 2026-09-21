<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status?: string | null
}>()

const type = computed(() => {
  switch (props.status?.toLowerCase()) {
    case 'active':
    case 'success':
    case 'completed':
      return 'success'
    case 'draft':
    case 'pending':
      return 'info'
    case 'warning':
    case 'rolled_back':
      return 'warning'
    case 'failed':
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
})

const label = computed(() => {
  if (!props.status) return '未知'
  switch (props.status.toLowerCase()) {
    case 'active':
      return '已激活'
    case 'draft':
      return '草稿'
    case 'rolled_back':
      return '已回滚'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return props.status
  }
})
</script>

<template>
  <el-tag :type="type" size="small" effect="light" class="status-tag">
    {{ label }}
  </el-tag>
</template>

<style scoped>
.status-tag {
  font-weight: 500;
}
</style>
