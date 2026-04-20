<script setup lang="ts">
import type { Demand, DemandStatus } from '~/types/domain'
import { DEMAND_STATUSES } from '~/types/domain'
import { formatCurrencyFromCents, formatDate, priorityLabel, todayIsoDate } from '~/utils/format'

const { demands, loading, error, fetchDemands, updateDemandStatus, duplicateDemand } = useDemands()
const { openDemandModal } = useDemandModal()
const draggingId = ref<string | null>(null)

const currentMonthLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())
)

const monthDemandItems = computed(() => {
  const now = new Date()
  return demands.value.filter((demand) => {
    const created = new Date(demand.created_at)
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  })
})

const kpis = computed(() => {
  const pending = demands.value.filter((demand) => demand.status !== 'done').length
  const done = demands.value.filter((demand) => demand.status === 'done').length
  const blocked = demands.value.filter((demand) => demand.status === 'blocked').length
  const monthRevenue = monthDemandItems.value.reduce((sum, demand) => sum + (demand.value_cents || 0), 0)
  const todayCount = demands.value.filter((demand) => demand.status === 'today' || demand.due_at === todayIsoDate()).length
  return { pending, done, blocked, monthRevenue, todayCount }
})

const columns = computed(() =>
  DEMAND_STATUSES.map((status) => ({
    ...status,
    items: demands.value.filter((demand) => demand.status === status.value)
  }))
)

onMounted(fetchDemands)

function startDrag(demand: Demand) {
  draggingId.value = demand.id
}

async function dropOn(status: DemandStatus) {
  const demand = demands.value.find((item) => item.id === draggingId.value)
  draggingId.value = null
  if (!demand || demand.status === status) return
  await updateDemandStatus(demand, status)
}
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-wrap items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text">Kanban</h1>
        <p class="mt-1 text-sm text-muted">
          {{ currentMonthLabel }} · {{ monthDemandItems.length }} demandas neste mes
        </p>
      </div>
      <button class="btn btn-primary ml-auto" type="button" @click="openDemandModal()">+ Nova Demanda</button>
    </section>

    <p v-if="error" class="panel border-danger/30 bg-danger/10 p-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="panel p-4 text-sm text-muted">Carregando kanban...</p>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Pendentes" :value="kpis.pending" subtitle="Tudo que ainda pede acao" tone="warn" />
      <StatCard title="Prontos" :value="kpis.done" subtitle="Concluidos no historico" tone="ok" />
      <StatCard title="Travados" :value="kpis.blocked" subtitle="Onde falta informacao" tone="danger" />
      <StatCard
        title="Controle Geral"
        :value="formatCurrencyFromCents(kpis.monthRevenue)"
        :subtitle="`${demands.length} demandas totais · ${kpis.todayCount} para hoje`"
        tone="action"
      />
    </section>

    <section class="grid gap-4 xl:grid-cols-5">
      <div
        v-for="column in columns"
        :key="column.value"
        class="min-h-96 border border-line bg-panel/70 p-3"
        style="border-radius: 8px"
        @dragover.prevent
        @drop="dropOn(column.value)"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="font-semibold text-text">{{ column.label }}</p>
          <span class="status-pill border-line bg-panelSoft text-muted">{{ column.items.length }}</span>
        </div>

        <div class="space-y-3">
          <article
            v-for="demand in column.items"
            :key="demand.id"
            class="border border-line bg-panelSoft p-3 transition hover:border-muted"
            style="border-radius: 8px"
            draggable="true"
            @dragstart="startDrag(demand)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-semibold text-text">{{ demand.title }}</p>
                <p class="mt-1 truncate text-xs text-muted">{{ demand.client }} · {{ demand.type_name }}</p>
              </div>
              <span
                class="h-2.5 w-2.5 shrink-0 rounded-full"
                :class="{
                  'bg-danger': demand.priority === 'high',
                  'bg-warn': demand.priority === 'medium',
                  'bg-ok': demand.priority === 'low'
                }"
              />
            </div>

            <p class="mt-3 line-clamp-2 text-sm text-zinc-300">{{ demand.original_request }}</p>
            <div class="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
              <span>{{ priorityLabel(demand.priority) }}</span>
              <span>{{ formatDate(demand.due_at) }}</span>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="demand.status !== 'today'"
                class="btn btn-secondary min-h-8 px-2 text-xs"
                type="button"
                @click="updateDemandStatus(demand, 'today')"
              >
                Hoje
              </button>
              <button
                v-if="demand.status !== 'later'"
                class="btn btn-ghost min-h-8 px-2 text-xs"
                type="button"
                @click="updateDemandStatus(demand, 'later')"
              >
                Depois
              </button>
              <button
                v-if="demand.status !== 'blocked'"
                class="btn btn-ghost min-h-8 px-2 text-xs"
                type="button"
                @click="updateDemandStatus(demand, 'blocked')"
              >
                Travar
              </button>
              <button class="btn btn-ghost min-h-8 px-2 text-xs" type="button" @click="openDemandModal(demand)">
                Abrir
              </button>
              <button class="btn btn-ghost min-h-8 px-2 text-xs" type="button" @click="duplicateDemand(demand)">
                Duplicar
              </button>
              <button
                v-if="demand.status !== 'done'"
                class="btn btn-secondary min-h-8 px-2 text-xs"
                type="button"
                @click="updateDemandStatus(demand, 'done')"
              >
                Concluir
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
