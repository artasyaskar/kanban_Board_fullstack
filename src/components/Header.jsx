import { Plus, Sun, MoonStar, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'

export default function Header({ onAddTask, onAddColumn }) {
  const [dark, setDark] = useState(false)
  const { user, signOut } = useAuthStore()

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
          <div className="flex flex-col">
            <h1 className="text-[1.25rem] md:text-2xl font-semibold tracking-tight leading-6">Kanban Board</h1>
            <span className="hidden md:block text-[10px] text-white/80 text-neon">
              𝔹𝕪 𝔸𝕣𝕥𝕒𝕤 𝕐𝕒𝕤𝕜𝕒𝕣
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end max-w-full">
          <button className="btn btn-ghost" aria-label="Toggle theme" onClick={toggleDark}>
            {dark ? <Sun size={18} /> : <MoonStar size={18} />}
          </button>
          {user && (
            <>
              {/* Mobile: compact account button */}
              <button
                className="btn btn-ghost sm:hidden"
                aria-label="Sign out"
                title={user.email}
                onClick={() => {
                  if (window.confirm('Sign out?')) signOut()
                }}
              >
                <LogOut size={16} />
              </button>
              {/* Desktop: email chip */}
              <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-sm">
                <span className="text-white/80 truncate max-w-[180px]">{user.email}</span>
                <button className="btn btn-ghost h-8 px-2" title="Sign out" onClick={signOut}>
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
          <button className="btn btn-ghost hidden sm:inline-flex" onClick={onAddColumn}>
            + Add Column
          </button>
          <button className="btn btn-primary hover-neon whitespace-nowrap px-2 sm:px-3 h-9 sm:h-10 text-sm sm:text-base" onClick={onAddTask}>
            <Plus size={18} />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>
    </header>
  )
}
