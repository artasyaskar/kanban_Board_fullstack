import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import useTaskStore from '../store/taskStore'

export default function TaskCard({ task, onEdit = () => {}, dragging = false, overlay = false }) {
  const { deleteTask, draggingTaskId } = useTaskStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative',
    touchAction: 'none',
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteTask(task.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit()
  }

  // Action Button component with proper event handling
  const ActionButton = ({ icon: Icon, label, onClick, className = '' }) => {
    const handleTouchStart = (e) => {
      // Only prevent default if we're not in a scrollable container
      if (!e.target.closest('.custom-scroll')) {
        e.stopPropagation()
      }
    }

    const handleClick = (e) => {
      e.stopPropagation()
      onClick(e)
    }

    return (
      <button
        type="button"
        aria-label={label}
        onPointerDown={(e) => {
          // Prevent drag from starting when pressing the button (pointer covers mouse+touch)
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={`${className} p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation`}
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
        }}
      >
        <Icon size={16} />
      </button>
    )
  }

  const CardInner = (
    <div 
      className="card glass grad-surface neon-border float-on-hover p-5 group relative overflow-hidden"
      onClick={(e) => {
        // Only handle clicks on the card itself, not on buttons
        if (e.target === e.currentTarget) {
          e.stopPropagation()
        }
      }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full grad-accent opacity-10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        {/* Drag handle: only this area starts drag */}
        <div 
          className={`flex-1 min-w-0 ${isDragging || draggingTaskId === task.id ? 'cursor-grabbing' : 'cursor-grab'}`}
          {...listeners}
          {...attributes}
        >
          <h3 className="font-semibold text-[15px] md:text-base truncate">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{task.description}</p>
          )}
        </div>
      </div>
      <div className="mt-2 pr-14">
        <span
          className={
            `inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap text-white shadow-sm ml-10 ` +
            (task.status === 'todo'
              ? 'bg-blue-500/85'
              : task.status === 'inprogress'
              ? 'bg-amber-500/90'
              : 'bg-emerald-500/90')
          }
        >
          {task.status === 'todo' && 'To Do'}
          {task.status === 'inprogress' && 'In Progress'}
          {task.status === 'done' && 'Done'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <ActionButton 
          icon={Pencil} 
          label="Edit task" 
          onClick={handleEdit} 
          className="neon-glow hover-neon"
        />
        <ActionButton 
          icon={Trash2} 
          label="Delete task" 
          onClick={handleDelete} 
          className="neon-glow hover-neon"
        />
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
      className={`select-none`}
      layoutId={task.id}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      {CardInner}
    </motion.div>
  )
}
