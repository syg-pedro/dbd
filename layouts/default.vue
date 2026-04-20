<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { isOpen, editingDemand, openDemandModal, closeDemandModal } = useDemandModal()

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/equipe', label: 'Equipe' }
]

const shortcutHandler = (event: KeyboardEvent) => {
  if (!(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (key === 'n') {
    event.preventDefault()
    openDemandModal()
  }
  if (key === 'k') {
    event.preventDefault()
    focusSearch()
  }
}

function handleDemandModalUpdate(value: boolean) {
  if (value) {
    isOpen.value = true
    return
  }
  closeDemandModal()
}

function focusSearch() {
  const input = document.querySelector<HTMLInputElement>('[data-global-search]')
  input?.focus()
  input?.select()
}

async function signOut() {
  await supabase.auth.signOut()
  user.value = null
  await navigateTo('/login', { replace: true })
}

onMounted(() => {
  window.addEventListener('keydown', shortcutHandler)
})

onBeforeUnmount(() => window.removeEventListener('keydown', shortcutHandler))
</script>

<template>
  <div v-if="route.path === '/login'">
    <slot />
  </div>

  <div v-else class="min-h-screen">
    <header class="border-b border-line bg-ink/86 backdrop-blur">
      <div class="shell-width flex min-h-20 flex-wrap items-center gap-4 py-4">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-3">
          <img src="/icons/icon-192.png" alt="DBD" class="h-10 w-10 rounded-lg" />
          <div class="min-w-0">
            <p class="truncate text-xl font-bold text-text">Dashboard de Demandas</p>
            <p class="truncate text-sm text-muted">Gestao completa de design e producao</p>
          </div>
        </NuxtLink>

        <nav class="ml-auto flex flex-wrap items-center gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="btn btn-ghost min-h-9 px-3"
            :class="{ 'bg-panelSoft text-text': route.path === item.to }"
          >
            {{ item.label }}
          </NuxtLink>
          <button class="btn btn-secondary min-h-9 px-3" type="button" @click="signOut">
            Sair
          </button>
          <button class="btn btn-primary min-h-9 px-4" type="button" @click="openDemandModal()">
            + Nova Demanda
          </button>
        </nav>
      </div>
    </header>

    <main class="shell-width py-6 sm:py-8">
      <div v-if="!user" class="panel p-6 text-sm text-muted">
        Redirecionando para login...
      </div>
      <slot v-else />
    </main>

    <DemandModal
      :model-value="isOpen"
      :demand="editingDemand"
      @update:model-value="handleDemandModalUpdate"
      @close="closeDemandModal"
    />
  </div>
</template>
