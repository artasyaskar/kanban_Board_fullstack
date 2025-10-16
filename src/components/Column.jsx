import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

export default function Column({ id, title, tasks, onEdit }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} column`}
      className={`card glass grad-surface neon-border p-5 transition-all flex flex-col ${
        isOver ? 'ring-neon' : 'ring-0'
      }`}
      style={{ maxHeight: '72vh' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="column-title">{title}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{tasks.length}</span>
      </div>
      <div className="space-y-3 min-h-[40px] overflow-y-auto pr-1 custom-scroll">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} />
        ))}
      </div>
    </section>
  )
}
