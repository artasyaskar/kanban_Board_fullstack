import { Plus, Sun, MoonStar } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header({ onAddTask, onAddColumn }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0B0B0F]/60 border-b border-gray-100 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg text-white grid place-items-center font-bold grad-accent neon-glow">
            KB
          </div>
          <h1 className="text-[1.25rem] md:text-2xl font-semibold tracking-tight">Kanban Board</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" aria-label="Toggle theme" onClick={toggleDark}>
            {dark ? <Sun size={18} /> : <MoonStar size={18} />}
          </button>
          <button className="btn btn-ghost" onClick={onAddColumn}>
            + Add Column
          </button>
          <button className="btn btn-primary hover-neon" onClick={onAddTask}>
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </header>
  )
}
