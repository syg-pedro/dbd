<script setup lang="ts">
import type { DemandStatus } from '~/types/domain'
import { statusMeta } from '~/utils/format'

const props = defineProps<{
  status: DemandStatus
}>()

const meta = computed(() => statusMeta(props.status))
</script>

<template>
  <span
    class="status-pill"
    :class="{
      'border-line bg-panelSoft text-muted': meta.tone === 'neutral',
      'border-ok/30 bg-ok/10 text-ok': meta.tone === 'ok',
      'border-warn/30 bg-warn/10 text-warn': meta.tone === 'warn',
      'border-danger/30 bg-danger/10 text-danger': meta.tone === 'danger'
    }"
  >
    {{ meta.label }}
  </span>
</template>
