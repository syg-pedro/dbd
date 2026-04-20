<script setup lang="ts">
definePageMeta({ layout: 'default' })

import { FIELD_LIMITS, limitText } from '~/utils/inputMasks'

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const mode = ref<'signin' | 'signup'>('signin')
const loading = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

function authErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : 'Nao foi possivel entrar.'
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'E-mail ainda nao confirmado. Desative Confirm email no Supabase Auth para entrar sem confirmacao.'
  }
  if (message.toLowerCase().includes('signups not allowed')) {
    return 'Cadastro bloqueado no Supabase. Ative Allow new users to sign up em Authentication > Sign In / Providers.'
  }
  return message
}

async function submit() {
  email.value = limitText(email.value.trim().toLowerCase(), FIELD_LIMITS.email)
  password.value = limitText(password.value, FIELD_LIMITS.password)

  loading.value = true
  error.value = null
  message.value = null

  try {
    if (mode.value === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      })
      if (signUpError) throw signUpError

      if (data.session) {
        await navigateTo('/')
        return
      }

      message.value = 'Cadastro criado. Desative a confirmacao de e-mail no Supabase Auth para entrar automaticamente.'
      mode.value = 'signin'
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    if (signInError) throw signInError
    await navigateTo('/')
  } catch (err) {
    error.value = authErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="grid min-h-screen place-items-center px-4 py-10">
    <form class="panel w-full max-w-md p-6 sm:p-8" @submit.prevent="submit">
      <div class="mb-8 flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="DBD" class="h-11 w-11 rounded-lg" />
        <div>
          <h1 class="text-2xl font-bold text-text">DBD Demandas</h1>
          <p class="text-sm text-muted">Entre para organizar o que vem agora.</p>
        </div>
      </div>

      <div class="space-y-4">
        <label>
          <span class="label">E-mail</span>
          <input
            v-model.trim="email"
            class="field"
            required
            type="email"
            inputmode="email"
            autocomplete="email"
            :maxlength="FIELD_LIMITS.email"
          />
        </label>
        <label>
          <span class="label">Senha</span>
          <input
            v-model="password"
            class="field"
            required
            minlength="6"
            :maxlength="FIELD_LIMITS.password"
            type="password"
            autocomplete="current-password"
          />
        </label>
      </div>

      <p v-if="error" class="mt-5 border border-danger/30 bg-danger/10 p-3 text-sm text-danger" style="border-radius: 8px">
        {{ error }}
      </p>
      <p v-if="message" class="mt-5 border border-ok/30 bg-ok/10 p-3 text-sm text-ok" style="border-radius: 8px">
        {{ message }}
      </p>

      <button class="btn btn-primary mt-6 w-full" :disabled="loading" type="submit">
        {{ loading ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar acesso' }}
      </button>

      <button
        class="btn btn-ghost mt-3 w-full"
        type="button"
        @click="mode = mode === 'signin' ? 'signup' : 'signin'"
      >
        {{ mode === 'signin' ? 'Criar primeiro acesso' : 'Ja tenho acesso' }}
      </button>
    </form>
  </main>
</template>
