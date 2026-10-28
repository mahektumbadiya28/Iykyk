import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Check, Edit3, Clock, Flag, Tag, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { listTasks, createTask, updateTask, deleteTask } from '../api'

const CATEGORIES = ['general', 'study', 'job', 'review', 'personal', 'project']
const PRIORITIES = ['low', 'medium', 'high']

const priorityColor = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
}
const categoryBadge = {
  study: 'badge-cyan',
  job: 'badge-purple',
  review: 'badge-orange',
  personal: 'badge-green',
  project: 'badge-blue',
  general: 'badge-blue',
}

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  return (
    <div className={`card-glow p-4 group transition-all duration-300 ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-surface-border hover:border-primary-500'
          }`}
        >
          {task.completed && <Check size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={categoryBadge[task.category] || 'badge-blue'}>
              <Tag size={10} />
              {task.category}
            </span>
            <span className={`text-xs font-medium ${priorityColor[task.priority]}`}>
              <Flag size={10} className="inline mr-1" />
              {task.priority}
            </span>
            {task.due_date && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            <span className="text-xs text-primary-400 font-medium ml-auto">+{task.xp_reward} XP</span>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="btn-icon p-1.5">
            <Edit3 size={13} />
          </button>
          <button onClick={() => onDelete(task.id)} className="btn-icon p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'general',
    priority: 'medium', due_date: '', xp_reward: 10
  })

  if (!open) return null
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({ ...form, due_date: form.due_date || null })
    setForm({ title: '', description: '', category: 'general', priority: 'medium', due_date: '', xp_reward: 10 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Add New Task</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Task Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="textarea h-16" placeholder="Optional details..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input type="datetime-local" className="input text-xs"
                value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">XP Reward</label>
              <input type="number" className="input" min={5} max={100} value={form.xp_reward}
                onChange={e => setForm(f => ({ ...f, xp_reward: +e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1"><Plus size={16} />Add Task</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tasks() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [filterDone, setFilterDone] = useState('all')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks().then(r => r.data),
  })

  const addMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => { qc.invalidateQueries(['tasks']); setShowAdd(false); toast.success('Task added! 🎯') }
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['dashboard']) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task removed') }
  })

  const handleToggle = (task) => {
    updateMut.mutate({ id: task.id, data: { completed: !task.completed } })
    if (!task.completed) toast.success(`+${task.xp_reward} XP earned! ⚡`, { icon: '🎉' })
  }

  const filtered = tasks.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (filterDone === 'done' && !t.completed) return false
    if (filterDone === 'pending' && t.completed) return false
    return true
  })

  const pending = filtered.filter(t => !t.completed)
  const done = filtered.filter(t => t.completed)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Task Manager</h2>
          <p className="section-subtitle">{pending.length} pending · {done.length} completed</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium mr-1">Filter:</span>
        {['all', ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterCat === c ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
            }`}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {['all', 'pending', 'done'].map(s => (
            <button
              key={s}
              onClick={() => setFilterDone(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterDone === s ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl">📋</span>
          <p className="text-white font-medium mt-3">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first task to get started!</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
            <Plus size={16} />Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                📌 Pending ({pending.length})
              </p>
              {pending.map(t => (
                <TaskCard key={t.id} task={t}
                  onToggle={handleToggle}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onEdit={() => {}}
                />
              ))}
            </div>
          )}
          {/* Completed */}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ✅ Completed ({done.length})
              </p>
              {done.map(t => (
                <TaskCard key={t.id} task={t}
                  onToggle={handleToggle}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onEdit={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AddTaskModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => addMut.mutate(data)}
      />
    </div>
  )
}
