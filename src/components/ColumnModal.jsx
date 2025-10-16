import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useTaskStore from '../store/taskStore'

export default function ColumnModal({ open, onClose }) {
  const { addColumn } = useTaskStore()
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setLabel('')
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    await addColumn(label)
    setSubmitting(false)
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="card w-full max-w-md p-5 relative"
      >
        <h3 className="text-lg font-semibold mb-4">Add Column</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="col-label">Column name</label>
            <input
              id="col-label"
              className="input"
              placeholder="e.g. Backlog, Archive, Review"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !label.trim()}>
              {submitting ? 'Creating...' : 'Create Column'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
