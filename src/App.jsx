import { useEffect, useState, useMemo, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { MouseSensor } from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header.jsx'
import Column from './components/Column.jsx'
import TaskCard from './components/TaskCard.jsx'
import TaskModal from './components/TaskModal.jsx'
import ColumnModal from './components/ColumnModal.jsx'
import Auth from './components/Auth.jsx'
import useTaskStore from './store/taskStore.js'
import useAuthStore from './store/authStore.js'

// AuthInitializer component to handle auth state before rendering the app
function AuthInitializer({ children }) {
  const { init, loading } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white/80">Loading...</div>
      </div>
    )
  }

  return children
}

export default function App() {
  const { tasks, fetchTasks, moveTaskLocal, moveTaskPersist, setDraggingTaskId, columns, fetchColumns } = useTaskStore()
  const { user } = useAuthStore()
  const [activeTask, setActiveTask] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [columnModalOpen, setColumnModalOpen] = useState(false)

  // Fetch data when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchColumns()
    }
  }, [user, fetchTasks, fetchColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts (desktop)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay before drag starts (mobile)
        tolerance: 5, // 5px of movement allowed during delay
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts (mouse)
      },
    })
  )

  const columnKeys = useMemo(() => new Set((columns || []).map(c => c.key)), [columns])

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
    setDraggingTaskId(active.id)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return
    const activeTaskId = active.id
    const overId = over.id

    const activeTaskObj = tasks.find(t => t.id === activeTaskId)
    if (!activeTaskObj) return

    if (columnKeys.has(overId)) {
      if (activeTaskObj.status !== overId) {
        moveTaskLocal(activeTaskId, overId)
      }
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setDraggingTaskId(null)
    if (!over) return

    const overId = over.id
    if (columnKeys.has(overId)) {
      await moveTaskPersist(active.id, overId)
    }
    setActiveTask(null)
  }

  const openCreateModal = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingTask(null)
  }

  const tasksByStatus = (status) => tasks.filter(t => t.status === status)

  return (
    <AuthInitializer>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full grad-accent opacity-10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-[26rem] h-[26rem] rounded-full grad-accent opacity-10 blur-3xl" />
        </div>

        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#cdd6f4',
              border: '1px solid #45475a',
              padding: '12px 16px',
              fontSize: '14px',
              borderRadius: '8px',
              maxWidth: '100%',
            },
            success: {
              iconTheme: {
                primary: '#a6e3a1',
                secondary: '#1e1e2e',
              },
            },
            error: {
              style: {
                background: '#313244',
                color: '#f38ba8',
                border: '1px solid #f38ba8',
              },
            },
          }}
        />
        
        {!user ? (
          <Auth />
        ) : (
          <>
            <Header onAddTask={openCreateModal} onAddColumn={() => setColumnModalOpen(true)} />
            <main className="mx-auto max-w-7xl px-4 pb-10">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                autoScroll={{
                  enabled: true,
                  acceleration: 15,
                  interval: 5,
                }}
              >
                <div className="grid grid-cols-1 md:[grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] gap-4 md:gap-6"> 
                  {(columns || []).map((c) => (
                    <Column
                      key={c.key}
                      id={c.key}
                      title={c.label}
                      tasks={tasksByStatus(c.key)}
                      onEdit={openEditModal}
                    />
                  ))}
                </div>

                <DragOverlay>
                  {activeTask ? (
                    <div className="opacity-90">
                      <TaskCard task={activeTask} dragging overlay />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </main>

            <AnimatePresence>
              {modalOpen && (
                <TaskModal open={modalOpen} onClose={closeModal} task={editingTask} />
              )}
              {columnModalOpen && (
                <ColumnModal open={columnModalOpen} onClose={() => setColumnModalOpen(false)} />
              )}
            </AnimatePresence>

            {/* Footer signature */}
            <footer className="mx-auto max-w-7xl px-4 pb-6 text-center">
              <div className="inline-flex items-center gap-2 text-[11px] text-white/70">
                <span className="inline-block size-1.5 rounded-full grad-accent" />
                <span className="text-neon">𝔹𝕪 𝔸𝕣𝕥𝕒𝕤 𝕐𝕒𝕤𝕜𝕒𝕣</span>
              </div>
            </footer>
          </>
        )}
      </div>
    </AuthInitializer>
  )
}