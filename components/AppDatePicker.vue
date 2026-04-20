<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    min?: string
    max?: string
    placeholder?: string
    clearable?: boolean
  }>(),
  {
    min: '2020-01-01',
    max: '2100-12-31',
    placeholder: 'Selecionar data',
    clearable: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type CalendarDay = {
  key: string
  iso: string
  label: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
}

const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const monthCursor = ref(startOfMonth(parseIsoDate(props.modelValue) || new Date()))
const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const selectedLabel = computed(() => (props.modelValue ? formatDateLabel(props.modelValue) : props.placeholder))
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(monthCursor.value)
)

const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = startOfMonth(monthCursor.value)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const iso = toIsoDate(date)
    return {
      key: `${iso}-${index}`,
      iso,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === monthCursor.value.getMonth(),
      isToday: iso === toIsoDate(new Date()),
      isSelected: iso === props.modelValue,
      isDisabled: iso < props.min || iso > props.max
    }
  })
})

watch(
  () => props.modelValue,
  (value) => {
    const date = parseIsoDate(value)
    if (date) monthCursor.value = startOfMonth(date)
  }
)

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatDateLabel(value: string) {
  const date = parseIsoDate(value)
  if (!date) return value
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function moveMonth(offset: number) {
  monthCursor.value = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() + offset, 1)
}

function selectDate(day: CalendarDay) {
  if (day.isDisabled) return
  emit('update:modelValue', day.iso)
  isOpen.value = false
}

function clearDate() {
  emit('update:modelValue', '')
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
      :aria-expanded="isOpen"
      @click.stop="isOpen = !isOpen"
      @keydown.escape="isOpen = false"
    >
      <span class="truncate" :class="{ 'text-muted': !modelValue }">{{ selectedLabel }}</span>
      <span class="grid h-5 w-5 shrink-0 place-items-center border border-line bg-panel text-xs text-muted" style="border-radius: 6px">
        ◷
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] border border-line bg-panel p-3 shadow-panel"
      style="border-radius: 8px"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <button class="btn btn-ghost min-h-8 px-2" type="button" @click="moveMonth(-1)">Anterior</button>
        <p class="truncate text-sm font-semibold capitalize text-text">{{ monthLabel }}</p>
        <button class="btn btn-ghost min-h-8 px-2" type="button" @click="moveMonth(1)">Proximo</button>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
        <span v-for="day in weekdayLabels" :key="day" class="py-1">{{ day }}</span>
      </div>

      <div class="mt-1 grid grid-cols-7 gap-1">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          class="grid aspect-square place-items-center border text-sm transition"
          :class="[
            day.isSelected
              ? 'border-action bg-action text-white'
              : day.isToday
                ? 'border-action/70 bg-action/10 text-text'
                : 'border-transparent bg-panelSoft text-text hover:border-muted',
            !day.isCurrentMonth && !day.isSelected ? 'text-muted/60' : '',
            day.isDisabled ? 'cursor-not-allowed opacity-30 hover:border-transparent' : ''
          ]"
          style="border-radius: 8px"
          type="button"
          :disabled="day.isDisabled"
          @click="selectDate(day)"
        >
          {{ day.label }}
        </button>
      </div>

      <div v-if="clearable" class="mt-3 flex justify-end">
        <button class="btn btn-ghost min-h-8 px-2 text-xs" type="button" @click="clearDate">Limpar</button>
      </div>
    </div>
  </div>
</template>
