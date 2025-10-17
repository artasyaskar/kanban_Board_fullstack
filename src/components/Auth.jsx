import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export default function Auth() {
  const { signIn, signUp, error, signupSuccess, clearSignupSuccess } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)

  // Clear signup success message when switching modes
  useEffect(() => {
    if (mode === 'signin') {
      clearSignupSuccess()
    }
  }, [mode, clearSignupSuccess])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
        if (!error) {
          toast.success(
            <div>
              <p className="font-semibold">Check your email!</p>
              <p className="text-sm">We've sent a confirmation link to {email}</p>
            </div>,
            { duration: 10000 }
          )
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    clearSignupSuccess()
    setMode(newMode)
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="card glass neon-border p-6 w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </h2>
        
        {signupSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h3 className="font-medium text-green-400">Almost there!</h3>
              <p className="text-sm text-white/80 mt-1">
                We've sent a confirmation email to <span className="font-medium">{email}</span>.
                Please check your inbox and click the link to verify your account.
              </p>
            </div>
            <button
              onClick={() => setMode('signin')}
              className="btn btn-primary w-full"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/70 mb-4">
              {mode === 'signin' 
                ? 'Sign in to your Kanban workspace' 
                : 'Get started with your Kanban board'}
            </p>
            
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
                <label className="block text-sm mb-1" htmlFor="password">
                  Password
                  {mode === 'signup' && <span className="text-xs text-white/50 ml-1">(min 6 characters)</span>}
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  minLength={mode === 'signup' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-lg">
                  {error.includes('Invalid login credentials') 
                    ? 'Invalid email or password. Please try again.' 
                    : error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={loading}
              >
                {loading 
                  ? 'Please wait...' 
                  : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-xs text-white/70 text-center">
              {mode === 'signin' ? (
                <span>
                  Don't have an account?{' '}
                  <button 
                    className="text-primary-300 underline" 
                    onClick={() => switchMode('signup')}
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button 
                    className="text-primary-300 underline" 
                    onClick={() => switchMode('signin')}
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
