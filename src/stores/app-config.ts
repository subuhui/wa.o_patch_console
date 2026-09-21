import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export const useAppConfigStore = defineStore('app-config', () => {
  const isDark = useDark({
    storageKey: 'shorebird_theme_dark',
    valueDark: 'dark',
    valueLight: '',
  })
  const toggleDark = useToggle(isDark)

  const isCollapse = ref(false)

  function toggleSidebar() {
    isCollapse.value = !isCollapse.value
  }

  return {
    isDark,
    toggleDark,
    isCollapse,
    toggleSidebar,
  }
})
