import { create } from 'zustand'
import { supabase } from '../utils/supabaseClient'

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user || null, loading: false })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null })
    })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return set({ error: error.message }), null
    set({ session: data.session, user: data.user, error: null })
    return data
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return set({ error: error.message }), null
    set({ session: data.session, user: data.user, error: null })
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))

export default useAuthStore
