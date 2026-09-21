# Component Guidelines

> Component conventions, template patterns, and UI practices for Shorebird Console.

---

## Overview

Shorebird Console is built with **Vue 3 (Composition API)** and **Element Plus**. All components must follow single-file component (`.vue`) standards with TypeScript.

---

## Component Structure

Every component uses `<script setup lang="ts">`, `<template>`, and scoped styles `<style scoped>`.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage, ElMessageBox } from 'element-plus'
import { z } from 'zod'

// 1. Types & Interfaces
interface Props {
  status?: string
}

// 2. Props & Emits
const props = withDefaults(defineProps<Props>(), {
  status: 'unknown',
})
const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

// 3. State & Composables
const router = useRouter()
// ...
</script>

<template>
  <div class="example-component">
    <!-- UI Elements -->
  </div>
</template>

<style scoped>
.example-component {
  /* Scoped styles */
}
</style>
```

---

## Props Conventions

1. Define props with TypeScript interfaces:
   ```ts
   interface Props {
     status?: 'active' | 'rolled_back' | 'draft' | string
   }
   const props = withDefaults(defineProps<Props>(), {
     status: 'unknown',
   })
   ```
   *Real Example*: [`src/components/common/StatusTag.vue`](file:///Users/xxz/shorebird/shorebird-console/src/components/common/StatusTag.vue)

2. Props must be treated as **read-only**. Never mutate props directly; emit events or update via state stores.

---

## Frontend Forms & User Input

### 1. Form State & Schema Validation
Forms use reactive `ref` models validated by **Zod** schemas via `safeParse`:

```ts
const appForm = ref({
  displayName: '',
})

const appSchema = z.object({
  displayName: z.string().min(2, '应用名称至少包含 2 个字符'),
})

function handleCreate() {
  const result = appSchema.safeParse(appForm.value)
  if (!result.success) {
    ElMessage.warning(result.error.issues[0].message)
    return
  }
  createMutation.mutate({ display_name: appForm.value.displayName.trim() })
}
```
*Real Example*: [`src/features/apps/views/AppsListView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/apps/views/AppsListView.vue#L36-L62)

### 2. Dialog Forms & Form Items
```vue
<el-dialog v-model="createDialogVisible" title="新建应用" width="480px">
  <el-form :model="appForm" label-position="top" @submit.prevent="handleCreate">
    <el-form-item label="应用显示名称" required>
      <el-input
        v-model="appForm.displayName"
        placeholder="例如: 手机客户端"
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
```

### 3. Inline Prompts & Confirmations
For quick input or destructive confirmations, use Element Plus message boxes:
- **Renaming**: `ElMessageBox.prompt('请输入新的应用名称', '重命名应用', { ... })`
- **Destructive Deletion**: `ElMessageBox.confirm('确定要删除应用 ... 吗？此操作无法撤销！', '危险警告', { type: 'error', confirmButtonText: '确认删除' })`
*Real Example*: [`src/features/apps/views/AppsListView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/apps/views/AppsListView.vue#L65-L105)

---

## Drawers & Details Inspection
For viewing sub-resources (such as base release artifacts or application channels), use `<el-drawer>`:
- Bind visibility with `v-model="drawerVisible"`
- Include loading overlay: `v-loading="isLoading"`
- Support keyboard Escape dismissal and explicit close buttons.
*Real Example*: [`src/features/releases/views/ReleasesView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/releases/views/ReleasesView.vue#L209-L230)

---

## Common Mistakes & Anti-Patterns

1. ❌ **Avoid Options API**: Do not use `export default { data() {}, methods: {} }`. Always use `<script setup lang="ts">`.
2. ❌ **Do not bypass Zod validation**: Validate user inputs before invoking mutations.
3. ❌ **Avoid unhandled loading states**: Always bind `:loading` on action/submit buttons during asynchronous requests.
