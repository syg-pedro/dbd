import type { DemandType } from '~/types/domain'

const DEFAULT_TYPES = [
  { name: 'Feed', slug: 'feed', default_value_cents: 2000, default_minutes: 45, default_deadline_days: 3 },
  { name: 'Story', slug: 'story', default_value_cents: 1600, default_minutes: 30, default_deadline_days: 2 },
  { name: 'Carrossel', slug: 'carrossel', default_value_cents: 20000, default_minutes: 180, default_deadline_days: 5 },
  { name: 'Reels', slug: 'reels', default_value_cents: 25000, default_minutes: 180, default_deadline_days: 4 },
  { name: 'Video', slug: 'video', default_value_cents: 35000, default_minutes: 240, default_deadline_days: 6 },
  { name: 'Banner', slug: 'banner', default_value_cents: 3000, default_minutes: 60, default_deadline_days: 2 },
  { name: 'Flyer', slug: 'flyer', default_value_cents: 10000, default_minutes: 120, default_deadline_days: 4 },
  { name: 'Landing Page', slug: 'landing-page', default_value_cents: 30000, default_minutes: 300, default_deadline_days: 7 },
  { name: 'Logo', slug: 'logo', default_value_cents: 40000, default_minutes: 360, default_deadline_days: 8 },
  { name: 'Apresentacao', slug: 'apresentacao', default_value_cents: 50000, default_minutes: 300, default_deadline_days: 6 }
]

export function useDemandTypes() {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()
  const types = useState<DemandType[]>('demand-types', () => [])
  const loading = useState('demand-types-loading', () => false)
  const error = useState<string | null>('demand-types-error', () => null)

  async function fetchTypes() {
    if (!user.value) return
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('demand_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (fetchError) {
      error.value = fetchError.message
      loading.value = false
      return
    }

    types.value = data || []
    loading.value = false
  }

  return {
    types,
    loading,
    error,
    fetchTypes,
    defaults: DEFAULT_TYPES
  }
}
