import { create } from 'zustand'
import { supabase } from '../utils/supabaseClient'
import toast from 'react-hot-toast'

const table = 'tasks'

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  draggingTaskId: null,

  setDraggingTaskId: (id) => set({ draggingTaskId: id }),

  fetchTasks: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      toast.error('Failed to fetch tasks')
      set({ loading: false })
      return
    }
    set({ tasks: data || [], loading: false })
  },

  addTask: async ({ title, description, status }) => {
    const payload = {
      title,
      description: description || '',
      status: status || 'todo',
      created_at: new Date().toISOString(),
    }
    const optimisticId = `optimistic-${Math.random().toString(36).slice(2)}`
    set({ tasks: [...get().tasks, { id: optimisticId, ...payload }] })
    const { data, error } = await supabase.from(table).insert(payload).select().single()
    if (error) {
      set({ tasks: get().tasks.filter(t => t.id !== optimisticId) })
      toast.error('Failed to create task')
      return null
    }
    set({ tasks: get().tasks.map(t => t.id === optimisticId ? data : t) })
    toast.success('Task created')
    return data
  },

  updateTask: async (id, updates) => {
    const prev = get().tasks
    set({ tasks: prev.map(t => (t.id === id ? { ...t, ...updates } : t)) })
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
    if (error) {
      set({ tasks: prev })
      toast.error('Failed to update task')
      return null
    }
    toast.success('Task updated')
    return data
  },

  deleteTask: async (id) => {
    const prev = get().tasks
    set({ tasks: prev.filter(t => t.id !== id) })
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      set({ tasks: prev })
      toast.error('Failed to delete task')
      return false
    }
    toast.success('Task deleted')
    return true
  },

  moveTaskLocal: (id, newStatus) => {
    set({ tasks: get().tasks.map(t => (t.id === id ? { ...t, status: newStatus } : t)) })
  },

  moveTaskPersist: async (id, newStatus) => {
    const prev = get().tasks
    set({ tasks: prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)) })
    const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', id)
    if (error) {
      set({ tasks: prev })
      toast.error('Failed to move task')
      return false
    }
    return true
  },
}))

export default useTaskStore
