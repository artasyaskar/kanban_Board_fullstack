import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'

export default function Auth() {
  const { signIn, signUp, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (mode === 'signin') {
      await signIn(email.trim(), password)
    } else {
      await signUp(email.trim(), password)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="card glass neon-border p-6 w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-1">Welcome</h2>
        <p className="text-sm text-white/70 mb-4">Sign in to your Kanban workspace</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="mt-3 text-xs text-white/70">
          {mode === 'signin' ? (
            <span>
              New here?{' '}
              <button className="text-primary-300 underline" onClick={() => setMode('signup')}>Create an account</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button className="text-primary-300 underline" onClick={() => setMode('signin')}>Sign in</button>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}
