import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header.jsx'
import Column from './components/Column.jsx'
import TaskCard from './components/TaskCard.jsx'
import TaskModal from './components/TaskModal.jsx'
import useTaskStore from './store/taskStore.js'

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

export default function App() {
  const { tasks, fetchTasks, moveTaskLocal, moveTaskPersist, setDraggingTaskId } = useTaskStore()
  const [activeTask, setActiveTask] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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

    if (overId === 'todo' || overId === 'inprogress' || overId === 'done') {
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
    if (overId === 'todo' || overId === 'inprogress' || overId === 'done') {
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
    <div className="min-h-screen">
      <Header onAddTask={openCreateModal} />
      <main className="mx-auto max-w-7xl px-4 pb-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {columns.map((c) => (
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
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  )
}
