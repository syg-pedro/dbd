import type { Demand, DemandForm } from '~/types/domain'
import { applyDemandAutomation, duplicateDemandPayload } from '~/utils/automation'
import { todayIsoDate } from '~/utils/format'

export function useDemands() {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()
  const { version, refreshDemands } = useDemandRefresh()
  const { types, fetchTypes } = useDemandTypes()
  const demands = useState<Demand[]>('demands', () => [])
  const loading = useState('demands-loading', () => false)
  const error = useState<string | null>('demands-error', () => null)

  async function fetchDemands() {
    if (!user.value) return
    loading.value = true
    error.value = null

    if (!types.value.length) await fetchTypes()

    const { data, error: fetchError } = await supabase
      .from('demands')
      .select('*, demand_links(*), demand_files(*)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      error.value = fetchError.message
      loading.value = false
      return
    }

    demands.value = data || []
    loading.value = false
  }

  async function saveDemand(form: DemandForm, files: File[] = []) {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData.session?.user || user.value
    if (!currentUser) throw new Error('Usuario nao autenticado.')
    const automated = applyDemandAutomation(form, types.value)

    const payload = {
      owner_id: currentUser.id,
      status: automated.status,
      client: automated.client.trim(),
      type_id: automated.type_id,
      type_name: automated.type_name,
      title: automated.title.trim(),
      original_request: automated.original_request.trim(),
      content: automated.content.trim() || null,
      additional: automated.additional.trim() || null,
      notes: automated.notes.trim() || null,
      references_text: automated.references_text.trim() || null,
      priority: automated.priority,
      requester_id: automated.requester_id,
      designer_id: automated.designer_id,
      artwork_url: automated.artwork_url.trim() || null,
      requested_at: automated.requested_at || todayIsoDate(),
      due_at: automated.due_at || null,
      delivery_at: automated.delivery_at || null,
      posting_at: automated.posting_at || null,
      value_cents: automated.value_cents || 0,
      spent_minutes: automated.spent_minutes || 0,
      completed_at: automated.status === 'done' ? new Date().toISOString() : null
    }

    let demandId = automated.id

    if (automated.id) {
      const { error: updateError } = await supabase.from('demands').update(payload).eq('id', automated.id)
      if (updateError) throw updateError
    } else {
      const { data, error: insertError } = await supabase.from('demands').insert(payload).select('id').single()
      if (insertError) throw insertError
      demandId = data.id
    }

    if (!demandId) throw new Error('Nao foi possivel identificar a demanda salva.')

    await replaceLinks(demandId, automated.links)
    if (files.length) await uploadDemandFiles(demandId, files)
    await fetchDemands()
    refreshDemands()
  }

  async function replaceLinks(demandId: string, links: string[]) {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData.session?.user || user.value
    if (!currentUser) return
    await supabase.from('demand_links').delete().eq('demand_id', demandId)
    const cleaned = links.map((url) => url.trim()).filter(Boolean)
    if (!cleaned.length) return

    const rows = cleaned.map((url) => ({
      demand_id: demandId,
      owner_id: currentUser.id,
      url,
      label: null,
      kind: url.includes('drive.google.com') ? 'artwork' : 'reference'
    }))

    const { error: linkError } = await supabase.from('demand_links').insert(rows)
    if (linkError) throw linkError
  }

  async function uploadDemandFiles(demandId: string, files: File[]) {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData.session?.user || user.value
    if (!currentUser) return

    for (const file of files) {
      if (!file.type.startsWith('image/')) throw new Error('Envie apenas imagens no MVP.')

      const storagePath = `${currentUser.id}/${demandId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '-')}`
      const { error: uploadError } = await supabase.storage.from('demand-files').upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      })

      if (uploadError) throw uploadError

      const { error: fileError } = await supabase.from('demand_files').insert({
        demand_id: demandId,
        owner_id: currentUser.id,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size
      })

      if (fileError) throw fileError
    }
  }

  async function updateDemandStatus(demand: Demand, status: Demand['status']) {
    const { error: updateError } = await supabase
      .from('demands')
      .update({
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null
      })
      .eq('id', demand.id)

    if (updateError) throw updateError
    await fetchDemands()
    refreshDemands()
  }

  async function duplicateDemand(demand: Demand) {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData.session?.user || user.value
    if (!currentUser) throw new Error('Usuario nao autenticado.')
    const payload = {
      ...duplicateDemandPayload(demand),
      owner_id: currentUser.id
    }

    const { error: insertError } = await supabase.from('demands').insert(payload)
    if (insertError) throw insertError
    await fetchDemands()
    refreshDemands()
  }

  watch(version, fetchDemands)

  return {
    demands,
    loading,
    error,
    fetchDemands,
    saveDemand,
    updateDemandStatus,
    duplicateDemand
  }
}
