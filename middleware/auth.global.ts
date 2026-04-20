export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const isLogin = to.path === '/login'
  const { data } = await supabase.auth.getSession()
  const currentUser = data.session?.user || null

  if (!currentUser && !isLogin) return navigateTo('/login')
  if (currentUser && isLogin) return navigateTo('/')
})
