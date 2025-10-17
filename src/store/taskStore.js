import { create } from 'zustand'
import { supabase } from '../utils/supabaseClient'
import toast from 'react-hot-toast'

const table = 'tasks'
const columnsTable = 'columns'

const DEFAULT_COLUMNS = [
  { key: 'todo', label: 'To Do', position: 1 },
  { key: 'inprogress', label: 'In Progress', position: 2 },
  { key: 'done', label: 'Done', position: 3 },
]

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  draggingTaskId: null,
  columns: DEFAULT_COLUMNS, // fallback if columns table not available
  // Map to track optimistic IDs to real IDs when insert resolves
  optimisticIdMap: {},

  // LocalStorage status overrides (fallback persistence without DB changes)
  _getStatusOverrides: () => {
    try {
      const raw = localStorage.getItem('kb_status_overrides')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  },
  _setStatusOverride: (taskId, status) => {
    try {
      const map = { ...get()._getStatusOverrides(), [taskId]: status }
      localStorage.setItem('kb_status_overrides', JSON.stringify(map))
    } catch {}
  },
  _clearStatusOverride: (taskId) => {
    try {
      const map = get()._getStatusOverrides()
      if (map[taskId]) {
        delete map[taskId]
        localStorage.setItem('kb_status_overrides', JSON.stringify(map))
      }
    } catch {}
  },

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
    // Apply local overrides if present
    const overrides = get()._getStatusOverrides()
    const withOverrides = (data || []).map(t => (
      overrides[t.id] ? { ...t, status: overrides[t.id] } : t
    ))
    set({ tasks: withOverrides, loading: false })
  },

  // Columns CRUD
  deleteColumn: async (key) => {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid) return

    // First, delete all tasks in this column
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('status', key)
      .eq('user_id', uid)

    if (taskError) {
      toast.error('Failed to delete tasks in column')
      return
    }

    // Then delete the column
    const { error } = await supabase
      .from(columnsTable)
      .delete()
      .eq('key', key)
      .eq('user_id', uid)

    if (error) {
      toast.error('Failed to delete column')
      return
    }

    // Update local state
    set(state => ({
      columns: state.columns.filter(col => col.key !== key),
      tasks: state.tasks.filter(task => task.status !== key)
    }))

    toast.success('Column deleted')
  },

  fetchColumns: async () => {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid) { set({ columns: DEFAULT_COLUMNS }); return }
    // Try fetch from Supabase; fallback to defaults if table missing
    const { data, error } = await supabase
      .from(columnsTable)
      .select('*')
      .eq('user_id', uid)
      .order('position', { ascending: true })

    if (error) {
      // Table may not exist; continue with defaults silently
      return
    }

    if (!data || data.length === 0) {
      // Seed defaults
      const seedRows = DEFAULT_COLUMNS.map(c => ({ ...c, user_id: uid }))
      const { error: seedErr } = await supabase.from(columnsTable).insert(seedRows)
      if (seedErr) return
      set({ columns: seedRows })
    } else {
      set({ columns: data })
    }
  },

  addColumn: async (labelRaw) => {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid) { toast.error('Please sign in'); return null }
    const label = labelRaw.trim()
    if (!label) return null
    const slugBase = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'column'
    let slug = slugBase
    const existing = new Set(get().columns.map(c => c.key))
    let i = 1
    while (existing.has(slug)) { slug = `${slugBase}-${i++}` }
    const position = (get().columns[get().columns.length - 1]?.position || 0) + 1

    // Optimistic UI
    const optimistic = { key: slug, label, position, user_id: uid }
    set({ columns: [...get().columns, optimistic] })

    const { error } = await supabase.from(columnsTable).insert(optimistic)
    if (error) {
      // Revert if table missing or error
      set({ columns: get().columns.filter(c => c.key !== slug) })
      toast.error('Failed to create column')
      return null
    }
    toast.success('Column created')
    return optimistic
  },

  addTask: async ({ title, description, status }) => {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid) { toast.error('Please sign in'); return null }
    const payload = {
      title,
      description: description || '',
      status: status || 'todo',
      created_at: new Date().toISOString(),
      user_id: uid,
    }
    const optimisticId = `optimistic-${Math.random().toString(36).slice(2)}`
    set({ tasks: [...get().tasks, { id: optimisticId, ...payload }] })
    const { data, error } = await supabase.from(table).insert(payload).select().single()
    if (error) {
      set({ tasks: get().tasks.filter(t => t.id !== optimisticId) })
      toast.error('Failed to create task')
      return null
    }
    // Replace optimistic task with real row and record mapping
    set({ 
      tasks: get().tasks.map(t => t.id === optimisticId ? data : t),
      optimisticIdMap: { ...get().optimisticIdMap, [optimisticId]: data.id }
    })
    toast.success('Task created')
    return data
  },

  updateTask: async (id, updates) => {
    const prev = get().tasks
    set({ tasks: prev.map(t => (t.id === id ? { ...t, ...updates } : t)) })
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
    if (error || !data || data.length === 0) {
      set({ tasks: prev })
      toast.error('Failed to update task')
      return null
    }
    toast.success('Task updated')
    return Array.isArray(data) ? data[0] : data
  },

  deleteTask: async (id) => {
    const prev = get().tasks
    set({ tasks: prev.filter(t => t.id !== id) })
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()
    if (error || !data) {
      set({ tasks: prev })
      toast.error('Failed to delete task')
      return false
    }
    // Clear any local override
    get()._clearStatusOverride(id)
    toast.success('Task deleted')
    return true
  },

  moveTaskLocal: (id, newStatus) => {
    set({ tasks: get().tasks.map(t => (t.id === id ? { ...t, status: newStatus } : t)) })
  },

  moveTaskPersist: async (id, newStatus) => {
    const prev = get().tasks
    set({ tasks: prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)) })

    // Resolve real ID if this is an optimistic one
    let realId = id
    const map = get().optimisticIdMap || {}
    const isOptimistic = id.startsWith('optimistic-')

    if (isOptimistic && !map[id]) {
      // Wait briefly for insert to resolve and mapping to appear
      for (let i = 0; i < 10 && !get().optimisticIdMap[id]; i++) {
        // ~100ms * 10 = up to ~1s wait
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 100))
      }
    }
    realId = get().optimisticIdMap[id] || id

    const { data, error } = await supabase
      .from(table)
      .update({ status: newStatus })
      .eq('id', realId)
      .select()

    if (error || !data || data.length === 0) {
      // Even if DB update failed, persist locally to satisfy refresh requirement
      get()._setStatusOverride(realId, newStatus)
      toast.error('Saved locally (DB update failed)')
      return false
    }
    // Successful DB update: also sync local override to keep consistency across devices
    get()._setStatusOverride(realId, newStatus)
    return true
  },
}))

export default useTaskStore
