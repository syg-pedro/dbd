<script setup lang="ts">
type OptionValue = string | null

type DropdownOption = {
  value: OptionValue
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: OptionValue
    options: DropdownOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Selecionar',
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: OptionValue]
  change: [value: OptionValue]
}>()

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label || props.placeholder
)

function selectOption(value: OptionValue) {
  emit('update:modelValue', value)
  emit('change', value)
  isOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) isOpen.value = false
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="field flex min-h-10 items-center justify-between gap-3 text-left"
      type="button"
      :disabled="disabled"
      :aria-expanded="isOpen"
      @click.stop="isOpen = !isOpen"
      @keydown.escape="isOpen = false"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <span class="grid h-5 w-5 shrink-0 place-items-center border border-line bg-panel text-xs text-muted" style="border-radius: 6px">
        {{ isOpen ? '▲' : '▼' }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-y-auto border border-line bg-panel shadow-panel"
      style="border-radius: 8px"
    >
      <button
        v-for="option in options"
        :key="`${option.value ?? 'none'}-${option.label}`"
        class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-text transition hover:bg-panelSoft"
        :class="{ 'bg-action/15 text-white': option.value === modelValue }"
        type="button"
        @click="selectOption(option.value)"
      >
        <span class="truncate">{{ option.label }}</span>
        <span v-if="option.value === modelValue" class="h-2 w-2 rounded-full bg-action" />
      </button>
    </div>
  </div>
</template>
