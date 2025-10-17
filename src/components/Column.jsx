import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Trash2, X, Check } from 'lucide-react'
import TaskCard from './TaskCard'
import useTaskStore from '../store/taskStore'

export default function Column({ id, title, tasks, onEdit }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteColumn = useTaskStore(state => state.deleteColumn)
  const isDefaultColumn = ['todo', 'inprogress', 'done'].includes(id)

  const handleDelete = async () => {
    if (isDefaultColumn) {
      toast.error('Cannot delete default columns')
      return
    }
    await deleteColumn(id)
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} column`}
      className={`card glass grad-surface neon-border p-5 transition-all flex flex-col relative group min-h-0 overflow-hidden ${
        isOver ? 'ring-neon' : 'ring-0'
      }`}
      style={{ maxHeight: '72vh' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="column-title">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{tasks.length}</span>
          {!isDefaultColumn && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Delete ${title} column`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 z-10">
          <p className="text-center mb-4">
            Delete this column and all its {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors flex items-center gap-1"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <Check size={16} /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 min-h-0 pr-1 custom-scroll overflow-y-auto flex-1 max-h-[58vh] md:max-h-[62vh]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} />
        ))}
      </div>
    </section>
  )
}
