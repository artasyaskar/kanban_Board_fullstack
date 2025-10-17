import { create } from 'zustand'
import { supabase } from '../utils/supabaseClient'

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  loading: true,
  error: null,
  signupSuccess: false, // New state for signup success

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user || null, loading: false })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null })
    })
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      return null
    }
    set({ session: data.session, user: data.user, error: null })
    return data
  },

  signUp: async (email, password) => {
    set({ error: null, signupSuccess: false })
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      set({ error: error.message })
      return null
    }
    
    // If we get here, signup was successful
    set({ 
      signupSuccess: true,
      error: null 
    })
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, signupSuccess: false })
  },

  // Clear the signup success state
  clearSignupSuccess: () => set({ signupSuccess: false })
}))

export default useAuthStore
