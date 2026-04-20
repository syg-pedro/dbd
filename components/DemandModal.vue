<script setup lang="ts">
import type { Demand, DemandForm } from '~/types/domain'
import { DEMAND_STATUSES, PRIORITIES } from '~/types/domain'
import { applyDemandAutomation, findSimilarDemands } from '~/utils/automation'
import { formatCurrencyFromCents, todayIsoDate } from '~/utils/format'

const props = defineProps<{
  modelValue: boolean
  demand?: Demand | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const { people, fetchPeople } = usePeople()
const { types, fetchTypes } = useDemandTypes()
const { demands, saveDemand } = useDemands()

const form = reactive<DemandForm>(emptyForm())
const error = ref<string | null>(null)
const saving = ref(false)
const showAdvanced = ref(false)
const linkDraft = ref('')
const files = ref<File[]>([])

const requesters = computed(() => people.value.filter((person) => person.role === 'requester' && person.is_active))
const designers = computed(() => people.value.filter((person) => person.role === 'designer' && person.is_active))
const automatedPreview = computed(() => applyDemandAutomation({ ...form }, types.value))
const similarDemands = computed(() => {
  if (!form.client || !form.original_request) return []
  return findSimilarDemands(automatedPreview.value, demands.value)
})

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return
    resetForm()
    await Promise.all([fetchPeople(), fetchTypes()])
  }
)

watch(
  () => props.demand,
  () => {
    if (props.modelValue) resetForm()
  }
)

function emptyForm(): DemandForm {
  return {
    status: 'inbox',
    client: '',
    type_id: null,
    type_name: '',
    title: '',
    original_request: '',
    content: '',
    additional: '',
    notes: '',
    references_text: '',
    priority: 'medium',
    requester_id: null,
    designer_id: null,
    artwork_url: '',
    requested_at: todayIsoDate(),
    due_at: '',
    delivery_at: '',
    posting_at: '',
    value_cents: 0,
    spent_minutes: 0,
    links: []
  }
}

function resetForm() {
  const source = props.demand
  Object.assign(form, source ? demandToForm(source) : emptyForm())
  files.value = []
  linkDraft.value = ''
  error.value = null
  showAdvanced.value = Boolean(source)
}

function demandToForm(demand: Demand): DemandForm {
  return {
    id: demand.id,
    status: demand.status,
    client: demand.client,
    type_id: demand.type_id,
    type_name: demand.type_name,
    title: demand.title,
    original_request: demand.original_request,
    content: demand.content || '',
    additional: demand.additional || '',
    notes: demand.notes || '',
    references_text: demand.references_text || '',
    priority: demand.priority,
    requester_id: demand.requester_id,
    designer_id: demand.designer_id,
    artwork_url: demand.artwork_url || '',
    requested_at: demand.requested_at || todayIsoDate(),
    due_at: demand.due_at || '',
    delivery_at: demand.delivery_at || '',
    posting_at: demand.posting_at || '',
    value_cents: demand.value_cents || 0,
    spent_minutes: demand.spent_minutes || 0,
    links: demand.demand_links?.map((link) => link.url) || []
  }
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function addLink() {
  const url = linkDraft.value.trim()
  if (!url) return
  form.links.push(url)
  linkDraft.value = ''
}

function removeLink(index: number) {
  form.links.splice(index, 1)
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  files.value = Array.from(input.files || [])
}

function syncTypeDefaults() {
  const type = types.value.find((item) => item.id === form.type_id)
  if (!type) return
  form.type_name = type.name
  if (!form.value_cents) form.value_cents = type.default_value_cents
  if (!form.spent_minutes) form.spent_minutes = type.default_minutes
}

async function submit() {
  if (!form.client.trim() || !form.original_request.trim()) {
    error.value = 'Cliente e demanda sao obrigatorios.'
    return
  }

  saving.value = true
  error.value = null
  try {
    await saveDemand({ ...form }, files.value)
    close()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nao foi possivel salvar a demanda.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6">
      <form class="panel mx-auto w-full max-w-4xl p-5 sm:p-7" @submit.prevent="submit">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <p class="text-xl font-bold text-text">{{ demand ? 'Editar Demanda' : 'Nova Demanda' }}</p>
            <p class="mt-1 text-sm text-muted">Entrada rapida primeiro, detalhes quando fizer sentido.</p>
          </div>
          <button class="btn btn-ghost min-h-9 px-3" type="button" @click="close">Fechar</button>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label>
            <span class="label">Cliente *</span>
            <input v-model="form.client" class="field" autocomplete="off" placeholder="Ex: Academia PowerFit" />
          </label>
          <label>
            <span class="label">Demanda *</span>
            <input
              v-model="form.original_request"
              class="field"
              autocomplete="off"
              placeholder="Ex: post whey promocao para hoje"
            />
          </label>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <label>
            <span class="label">Status</span>
            <select v-model="form.status" class="field">
              <option v-for="status in DEMAND_STATUSES" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </label>
          <label>
            <span class="label">Tipo sugerido</span>
            <select v-model="form.type_id" class="field" @change="syncTypeDefaults">
              <option :value="null">{{ automatedPreview.type_name || 'Selecionar' }}</option>
              <option v-for="type in types" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
          </label>
          <label>
            <span class="label">Prioridade</span>
            <select v-model="form.priority" class="field">
              <option v-for="priority in PRIORITIES" :key="priority.value" :value="priority.value">
                {{ priority.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <label class="md:col-span-2">
            <span class="label">Titulo curto</span>
            <input v-model="form.title" class="field" :placeholder="automatedPreview.title" />
          </label>
          <label>
            <span class="label">Prazo</span>
            <input v-model="form.due_at" class="field" type="date" :placeholder="automatedPreview.due_at" />
          </label>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4">
          <div>
            <p class="text-sm font-semibold text-text">Sugestao automatica</p>
            <p class="text-xs text-muted">
              {{ automatedPreview.title }} · {{ automatedPreview.type_name }} ·
              {{ automatedPreview.due_at || 'sem prazo' }} ·
              {{ formatCurrencyFromCents(automatedPreview.value_cents) }}
            </p>
          </div>
          <button class="btn btn-secondary" type="button" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? 'Ocultar detalhes' : 'Detalhes avancados' }}
          </button>
        </div>

        <div v-if="showAdvanced" class="mt-5 space-y-5">
          <div class="grid gap-4 md:grid-cols-3">
            <label class="md:col-span-3">
              <span class="label">Conteudo</span>
              <textarea v-model="form.content" class="field min-h-24 resize-y" />
            </label>
            <label class="md:col-span-3">
              <span class="label">Adicional</span>
              <textarea v-model="form.additional" class="field min-h-20 resize-y" />
            </label>
            <label class="md:col-span-3">
              <span class="label">Observacao</span>
              <textarea v-model="form.notes" class="field min-h-20 resize-y" />
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label>
              <span class="label">Solicitante</span>
              <select v-model="form.requester_id" class="field">
                <option :value="null">Nenhum</option>
                <option v-for="person in requesters" :key="person.id" :value="person.id">{{ person.name }}</option>
              </select>
            </label>
            <label>
              <span class="label">Designer</span>
              <select v-model="form.designer_id" class="field">
                <option :value="null">Nenhum</option>
                <option v-for="person in designers" :key="person.id" :value="person.id">{{ person.name }}</option>
              </select>
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <label>
              <span class="label">Data de solicitacao</span>
              <input v-model="form.requested_at" class="field" type="date" />
            </label>
            <label>
              <span class="label">Entrega</span>
              <input v-model="form.delivery_at" class="field" type="date" />
            </label>
            <label>
              <span class="label">Postagem</span>
              <input v-model="form.posting_at" class="field" type="date" />
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label>
              <span class="label">Valor em centavos</span>
              <input v-model.number="form.value_cents" class="field" min="0" type="number" />
            </label>
            <label>
              <span class="label">Tempo gasto em minutos</span>
              <input v-model.number="form.spent_minutes" class="field" min="0" type="number" />
            </label>
          </div>

          <label>
            <span class="label">Referencias / Texto</span>
            <textarea
              v-model="form.references_text"
              class="field min-h-20 resize-y"
              placeholder="Descreva a inspiracao ou referencias visuais..."
            />
          </label>

          <div>
            <span class="label">Links</span>
            <div class="flex gap-2">
              <input v-model="linkDraft" class="field" placeholder="https://..." @keyup.enter.prevent="addLink" />
              <button class="btn btn-secondary" type="button" @click="addLink">+</button>
            </div>
            <div v-if="form.links.length" class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="(link, index) in form.links"
                :key="`${link}-${index}`"
                class="btn btn-ghost max-w-full justify-start px-2 text-xs"
                type="button"
                @click="removeLink(index)"
              >
                <span class="truncate">{{ link }}</span>
                <span>remover</span>
              </button>
            </div>
          </div>

          <label>
            <span class="label">Imagens</span>
            <input class="field" type="file" multiple accept="image/*" @change="handleFileChange" />
          </label>
        </div>

        <div v-if="similarDemands.length" class="mt-5">
          <p class="mb-2 text-sm font-semibold text-text">Parecidas no historico</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div v-for="item in similarDemands" :key="item.id" class="border border-line bg-panelSoft p-3 text-sm" style="border-radius: 8px">
              <p class="truncate font-semibold">{{ item.title }}</p>
              <p class="truncate text-xs text-muted">{{ item.client }} · {{ item.type_name }}</p>
            </div>
          </div>
        </div>

        <p v-if="error" class="mt-5 border border-danger/30 bg-danger/10 p-3 text-sm text-danger" style="border-radius: 8px">
          {{ error }}
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button class="btn btn-secondary" type="button" @click="close">Cancelar</button>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ saving ? 'Salvando...' : demand ? 'Salvar' : 'Criar Demanda' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
