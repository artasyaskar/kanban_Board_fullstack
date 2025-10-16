import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

export default function Column({ id, title, tasks, onEdit }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} column`}
      className={`card p-4 transition-colors ${
        isOver ? 'ring-2 ring-primary-400' : 'ring-0'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="column-title">{title}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{tasks.length}</span>
      </div>
      <div className="space-y-3 min-h-[40px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} />
        ))}
      </div>
    </section>
  )
}
