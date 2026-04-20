<script setup lang="ts">
import type { Person, PersonForm } from '~/types/domain'
import { PERSON_ROLES } from '~/types/domain'

const props = defineProps<{
  modelValue: boolean
  person?: Person | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const { savePerson } = usePeople()
const saving = ref(false)
const error = ref<string | null>(null)
const form = reactive<PersonForm>(emptyForm())

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) reset()
  }
)

watch(
  () => props.person,
  () => {
    if (props.modelValue) reset()
  }
)

function emptyForm(): PersonForm {
  return {
    name: '',
    role: 'requester',
    email: '',
    phone: '',
    is_active: true
  }
}

function reset() {
  Object.assign(
    form,
    props.person
      ? {
          id: props.person.id,
          name: props.person.name,
          role: props.person.role,
          email: props.person.email || '',
          phone: props.person.phone || '',
          is_active: props.person.is_active
        }
      : emptyForm()
  )
  error.value = null
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

async function submit() {
  if (!form.name.trim()) {
    error.value = 'Nome e obrigatorio.'
    return
  }

  saving.value = true
  error.value = null
  try {
    await savePerson({ ...form })
    close()
  } catch (err) {
    error.value =
      err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Nao foi possivel salvar o cadastro.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-3 sm:p-6">
      <form class="panel w-full max-w-lg p-5 sm:p-7" @submit.prevent="submit">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <p class="text-xl font-bold text-text">{{ person ? 'Editar Cadastro' : 'Novo Cadastro' }}</p>
            <p class="mt-1 text-sm text-muted">Solicitantes e designers do fluxo.</p>
          </div>
          <button class="btn btn-ghost min-h-9 px-3" type="button" @click="close">Fechar</button>
        </div>

        <div class="space-y-4">
          <label>
            <span class="label">Nome *</span>
            <input v-model="form.name" class="field" autocomplete="off" />
          </label>

          <label>
            <span class="label">Funcao *</span>
            <select v-model="form.role" class="field">
              <option v-for="role in PERSON_ROLES" :key="role.value" :value="role.value">{{ role.label }}</option>
            </select>
          </label>

          <label>
            <span class="label">E-mail</span>
            <input v-model="form.email" class="field" type="email" autocomplete="off" />
          </label>

          <label>
            <span class="label">Telefone / WhatsApp</span>
            <input v-model="form.phone" class="field" autocomplete="off" />
          </label>

          <label class="flex items-center gap-3 text-sm text-muted">
            <input v-model="form.is_active" type="checkbox" class="h-4 w-4 accent-action" />
            Ativo
          </label>
        </div>

        <p v-if="error" class="mt-5 border border-danger/30 bg-danger/10 p-3 text-sm text-danger" style="border-radius: 8px">
          {{ error }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button class="btn btn-secondary" type="button" @click="close">Cancelar</button>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ saving ? 'Salvando...' : person ? 'Salvar' : 'Cadastrar' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
