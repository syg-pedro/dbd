<script setup lang="ts">
import type { Person } from '~/types/domain'

const { people, loading, error, fetchPeople } = usePeople()
const isModalOpen = ref(false)
const editingPerson = ref<Person | null>(null)

const requesters = computed(() => people.value.filter((person) => person.role === 'requester'))
const designers = computed(() => people.value.filter((person) => person.role === 'designer'))

onMounted(fetchPeople)

function openPersonModal(person: Person | null = null) {
  editingPerson.value = person
  isModalOpen.value = true
}

function closePersonModal() {
  editingPerson.value = null
  isModalOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-wrap items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text">Equipe</h1>
        <p class="mt-1 text-sm text-muted">Solicitantes e designers que aparecem nas demandas.</p>
      </div>
      <button class="btn btn-primary ml-auto" type="button" @click="openPersonModal()">+ Novo Cadastro</button>
    </section>

    <p v-if="error" class="panel border-danger/30 bg-danger/10 p-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="panel p-4 text-sm text-muted">Carregando equipe...</p>

    <section class="grid gap-5 lg:grid-cols-2">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-bold text-text">Solicitantes</h2>
          <span class="status-pill border-line bg-panelSoft text-muted">{{ requesters.length }}</span>
        </div>

        <article
          v-for="person in requesters"
          :key="person.id"
          class="border border-line bg-panel p-4"
          style="border-radius: 8px"
        >
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-action/10 font-bold text-action">
              {{ person.name.slice(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="truncate font-semibold text-text">{{ person.name }}</p>
              <p class="truncate text-sm text-muted">{{ person.email || 'sem e-mail' }}</p>
              <p class="truncate text-sm text-muted">{{ person.phone || 'sem telefone' }}</p>
            </div>
            <button class="btn btn-ghost ml-auto min-h-8 px-2 text-xs" type="button" @click="openPersonModal(person)">
              Editar
            </button>
          </div>
        </article>

        <p v-if="!requesters.length && !loading" class="panel p-4 text-sm text-muted">Nenhum solicitante cadastrado.</p>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-bold text-text">Designers</h2>
          <span class="status-pill border-line bg-panelSoft text-muted">{{ designers.length }}</span>
        </div>

        <article
          v-for="person in designers"
          :key="person.id"
          class="border border-line bg-panel p-4"
          style="border-radius: 8px"
        >
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ok/10 font-bold text-ok">
              {{ person.name.slice(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="truncate font-semibold text-text">{{ person.name }}</p>
              <p class="truncate text-sm text-muted">{{ person.email || 'sem e-mail' }}</p>
              <p class="truncate text-sm text-muted">{{ person.phone || 'sem telefone' }}</p>
            </div>
            <button class="btn btn-ghost ml-auto min-h-8 px-2 text-xs" type="button" @click="openPersonModal(person)">
              Editar
            </button>
          </div>
        </article>

        <p v-if="!designers.length && !loading" class="panel p-4 text-sm text-muted">Nenhum designer cadastrado.</p>
      </div>
    </section>

    <PersonModal
      v-model="isModalOpen"
      :person="editingPerson"
      @close="closePersonModal"
    />
  </div>
</template>
