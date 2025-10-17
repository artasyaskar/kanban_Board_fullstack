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
        distance: 5,
        tolerance: 5,
        delay: 100,
      },
    }),
    useSensor(TouchSensor, {
      // Enable press delay of 250ms, with tolerance of 5px movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  // Add touch-action CSS to the document body to prevent browser interference
  useEffect(() => {
    // Add class to body for touch device detection
    document.body.classList.add('touch-device')
    document.body.style.touchAction = 'none' // Changed to 'none' for better touch control
    
    // Add CSS variables for touch feedback
    const style = document.createElement('style')
    style.textContent = `
      .task-card {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        user-select: none;
        touch-action: none; /* Disable default touch actions */
      }
      .task-card:active {
        transform: scale(1.02);
        transition: transform 0.1s ease;
      }
      /* Prevent text selection during drag */
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      /* Improve touch feedback */
      [role="button"] {
        cursor: pointer;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.body.classList.remove('touch-device')
      document.body.style.touchAction = ''
      document.head.removeChild(style)
    }
  }, [])

  const columnKeys = useMemo(() => new Set((columns || []).map(c => c.key)), [columns])

  const handleDragStart = useCallback((event) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    
    // Add visual feedback for touch devices
    if (event.activatorEvent.type.includes('touch')) {
      const element = document.getElementById(`task-${active.id}`)
      if (element) {
        element.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease'
        element.style.transform = 'scale(1.05)'
        element.style.zIndex = '1000'
      }
    }
    
    setActiveTask(task || null)
    setDraggingTaskId(active.id)
  }, [tasks])

  const handleDragOver = useCallback((event) => {
    const { active, over } = event
    if (!over) return
    
    const activeId = active.id.toString()
    const overId = over.id.toString()
    
    // Find the task being dragged
    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return
    
    // If dropping over a column
    if (columnKeys.has(overId)) {
      if (activeTask.status !== overId) {
        moveTaskLocal(activeId, overId)
      }
      return
    }
    
    // If dropping over another task
    const overTask = tasks.find(t => t.id === overId)
    if (overTask && activeId !== overId) {
      // Only move if the status has changed
      if (activeTask.status !== overTask.status) {
        moveTaskLocal(activeId, overTask.status)
      }
    }
  }, [tasks, columnKeys, moveTaskLocal])

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    
    // Clean up touch feedback
    const element = document.getElementById(`task-${active.id}`)
    if (element) {
      element.style.transform = ''
      element.style.zIndex = ''
      element.style.transition = ''
    }
    
    // Reset dragging state
    setDraggingTaskId(null)
    
    // If dropped outside a valid drop target
    if (!over) {
      setActiveTask(null)
      return
    }
    
    const activeId = active.id.toString()
    const overId = over.id.toString()
    
    // Find the task being dragged
    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) {
      setActiveTask(null)
      return
    }
    
    // If dropped on a column
    if (columnKeys.has(overId)) {
      if (activeTask.status !== overId) {
        await moveTaskPersist(activeId, overId)
      }
    } 
    // If dropped on another task
    else {
      const overTask = tasks.find(t => t.id === overId)
      if (overTask && activeId !== overId && activeTask.status !== overTask.status) {
        await moveTaskPersist(activeId, overTask.status)
      }
    }
    
    setActiveTask(null)
  }, [tasks, columnKeys, moveTaskPersist])

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
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 1000,
                    touchAction: 'none',
                  }}
                />
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