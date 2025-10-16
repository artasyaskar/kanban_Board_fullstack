import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import useTaskStore from '../store/taskStore'

export default function TaskCard({ task, onEdit, dragging = false, overlay = false }) {
  const { deleteTask, draggingTaskId } = useTaskStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const handleDelete = () => {
    deleteTask(task.id)
  }

  const CardInner = (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{task.description}</p>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button className="btn btn-ghost size-8" aria-label="Edit task" onClick={onEdit}>
            <Pencil size={16} />
          </button>
          <button className="btn btn-ghost size-8" aria-label="Delete task" onClick={handleDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {task.status === 'todo' && 'To Do'}
          {task.status === 'inprogress' && 'In Progress'}
          {task.status === 'done' && 'Done'}
        </span>
      </div>
    </div>
  )

  if (overlay) {
    return (
      <motion.div layoutId={task.id} className="cursor-grabbing" initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
        {CardInner}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`select-none ${isDragging || draggingTaskId === task.id ? 'cursor-grabbing' : 'cursor-grab'}`}
      layoutId={task.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {CardInner}
    </motion.div>
  )
}
