<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtitle?: string
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'action'
}>()
</script>

<template>
  <section class="panel min-h-36 p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-text">{{ title }}</p>
        <p v-if="subtitle" class="mt-6 text-xs text-muted">{{ subtitle }}</p>
      </div>
      <p
        class="text-3xl font-bold"
        :class="{
          'text-text': !tone || tone === 'neutral',
          'text-ok': tone === 'ok',
          'text-warn': tone === 'warn',
          'text-danger': tone === 'danger',
          'text-action': tone === 'action'
        }"
      >
        {{ value }}
      </p>
    </div>
  </section>
</template>
