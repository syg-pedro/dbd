import type { Person, PersonForm } from '~/types/domain'

export function usePeople() {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()
  const people = useState<Person[]>('people', () => [])
  const loading = useState('people-loading', () => false)
  const error = useState<string | null>('people-error', () => null)

  async function fetchPeople() {
    if (!user.value) return
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('people')
      .select('*')
      .order('role')
      .order('name')

    if (fetchError) {
      error.value = fetchError.message
      loading.value = false
      return
    }

    people.value = data || []
    loading.value = false
  }

  async function savePerson(form: PersonForm) {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData.session?.user || user.value
    if (!currentUser) throw new Error('Usuario nao autenticado.')

    const payload = {
      owner_id: currentUser.id,
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      is_active: form.is_active
    }

    if (form.id) {
      const { error: updateError } = await supabase.from('people').update(payload).eq('id', form.id).select('id').single()
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase.from('people').insert(payload).select('id').single()
      if (insertError) throw insertError
    }

    await fetchPeople()
  }

  return {
    people,
    loading,
    error,
    fetchPeople,
    savePerson
  }
}
