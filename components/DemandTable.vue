<script setup lang="ts">
import type { Demand } from '~/types/domain'
import { formatCurrencyFromCents, formatDate, formatMinutes, priorityLabel } from '~/utils/format'

defineProps<{
  demands: Demand[]
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [demand: Demand]
  duplicate: [demand: Demand]
  done: [demand: Demand]
}>()
</script>

<template>
  <section class="panel overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1040px] border-collapse">
        <thead class="bg-panelSoft">
          <tr>
            <th class="table-head">Status</th>
            <th class="table-head">Cliente</th>
            <th class="table-head">Tipo</th>
            <th class="table-head">Titulo</th>
            <th class="table-head">Prioridade</th>
            <th class="table-head">Prazo</th>
            <th class="table-head">Tempo</th>
            <th class="table-head">Valor</th>
            <th class="table-head text-right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="table-cell py-10 text-center text-muted">Carregando demandas...</td>
          </tr>
          <tr v-else-if="!demands.length">
            <td colspan="9" class="table-cell py-10 text-center text-muted">
              Nenhuma demanda encontrada.
            </td>
          </tr>
          <tr
            v-for="demand in demands"
            v-else
            :key="demand.id"
            class="border-t border-line transition hover:bg-panelSoft/60"
          >
            <td class="table-cell"><StatusPill :status="demand.status" /></td>
            <td class="table-cell font-semibold">{{ demand.client }}</td>
            <td class="table-cell text-muted">{{ demand.type_name }}</td>
            <td class="table-cell">
              <div class="max-w-80">
                <p class="truncate font-semibold">{{ demand.title }}</p>
                <p class="truncate text-xs text-muted">{{ demand.original_request }}</p>
              </div>
            </td>
            <td class="table-cell">{{ priorityLabel(demand.priority) }}</td>
            <td class="table-cell">{{ formatDate(demand.due_at) }}</td>
            <td class="table-cell">{{ formatMinutes(demand.spent_minutes) }}</td>
            <td class="table-cell font-semibold">{{ formatCurrencyFromCents(demand.value_cents) }}</td>
            <td class="table-cell">
              <div class="flex justify-end gap-2">
                <button class="btn btn-ghost min-h-8 px-2" type="button" @click="emit('edit', demand)">
                  Abrir
                </button>
                <button class="btn btn-ghost min-h-8 px-2" type="button" @click="emit('duplicate', demand)">
                  Duplicar
                </button>
                <button
                  v-if="demand.status !== 'done'"
                  class="btn btn-secondary min-h-8 px-2"
                  type="button"
                  @click="emit('done', demand)"
                >
                  Concluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
