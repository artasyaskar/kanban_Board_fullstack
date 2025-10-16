import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useTaskStore from '../store/taskStore'

export default function TaskModal({ open, onClose, task }) {
  const isEdit = Boolean(task)
  const { addTask, updateTask, columns } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setStatus(task.status || 'todo')
    } else {
      setTitle('')
      setDescription('')
      setStatus(columns?.[0]?.key || 'todo')
    }
  }, [isEdit, task, columns])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    if (isEdit) {
      await updateTask(task.id, { title: title.trim(), description: description.trim(), status })
    } else {
      await addTask({ title: title.trim(), description: description.trim(), status })
    }
    setSubmitting(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center px-4"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="card w-full max-w-lg p-5 relative"
      >
        <h3 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Task' : 'Add Task'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              placeholder="Write a clear title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="desc">Description</label>
            <textarea
              id="desc"
              className="textarea"
              placeholder="Add additional details"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="status">Column</label>
            <select
              id="status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {(columns || []).map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
