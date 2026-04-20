<script setup lang="ts">
import type { Demand, DemandStatus, Priority } from '~/types/domain'
import { DEMAND_STATUSES, PRIORITIES } from '~/types/domain'
import { formatCurrencyFromCents, normalizeText, todayIsoDate } from '~/utils/format'
import { FIELD_LIMITS } from '~/utils/inputMasks'

const { demands, loading, error, fetchDemands, updateDemandStatus, duplicateDemand } = useDemands()
const { openDemandModal } = useDemandModal()

const search = ref('')
const statusFilter = ref<'all' | DemandStatus>('all')
const priorityFilter = ref<'all' | Priority>('all')
const typeFilter = ref('all')
const clientFilter = ref('all')

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

const clients = computed(() => [...new Set(demands.value.map((demand) => demand.client))].sort())
const types = computed(() => [...new Set(demands.value.map((demand) => demand.type_name))].sort())
const statusOptions = computed(() => [
  { value: 'all', label: 'Todos os Status' },
  ...DEMAND_STATUSES.map((status) => ({ value: status.value, label: status.label }))
])
const typeOptions = computed(() => [
  { value: 'all', label: 'Todos os Tipos' },
  ...types.value.map((type) => ({ value: type, label: type }))
])
const clientOptions = computed(() => [
  { value: 'all', label: 'Todos os Clientes' },
  ...clients.value.map((client) => ({ value: client, label: client }))
])
const priorityOptions = computed(() => [
  { value: 'all', label: 'Todas' },
  ...PRIORITIES.map((priority) => ({ value: priority.value, label: priority.label }))
])

const filteredDemands = computed(() => {
  const query = normalizeText(search.value)
  return demands.value.filter((demand) => {
    const matchesSearch =
      !query ||
      normalizeText(`${demand.client} ${demand.title} ${demand.original_request} ${demand.type_name}`).includes(query)
    const matchesStatus = statusFilter.value === 'all' || demand.status === statusFilter.value
    const matchesPriority = priorityFilter.value === 'all' || demand.priority === priorityFilter.value
    const matchesType = typeFilter.value === 'all' || demand.type_name === typeFilter.value
    const matchesClient = clientFilter.value === 'all' || demand.client === clientFilter.value
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesClient
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

onMounted(fetchDemands)

async function markDone(demand: Demand) {
  await updateDemandStatus(demand, 'done')
}
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-wrap items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text">Dashboard de Demandas</h1>
        <p class="mt-1 text-sm text-muted">{{ currentMonthLabel }} · {{ monthDemandItems.length }} demandas neste mes</p>
      </div>
      <button class="btn btn-primary ml-auto" type="button" @click="openDemandModal()">+ Nova Demanda</button>
    </section>

    <p v-if="error" class="panel border-danger/30 bg-danger/10 p-4 text-sm text-danger">{{ error }}</p>

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

    <section class="panel p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-text">Filtros</p>
        <button class="btn btn-ghost min-h-8 px-2 text-xs" type="button" @click="search = ''">Limpar busca</button>
      </div>
      <div class="grid gap-3 md:grid-cols-5">
        <input
          v-model.trim="search"
          data-global-search
          class="field"
          :maxlength="FIELD_LIMITS.search"
          placeholder="Buscar..."
          autocomplete="off"
        />
        <AppDropdown v-model="statusFilter" :options="statusOptions" />
        <AppDropdown v-model="typeFilter" :options="typeOptions" />
        <AppDropdown v-model="clientFilter" :options="clientOptions" />
        <AppDropdown v-model="priorityFilter" :options="priorityOptions" />
      </div>
    </section>

    <DemandTable
      :demands="filteredDemands"
      :loading="loading"
      @edit="openDemandModal"
      @duplicate="duplicateDemand"
      @done="markDone"
    />
  </div>
</template>
