import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, CheckCircle, AlertTriangle, Lightbulb,
  Calendar, X, Loader2, RefreshCw, BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import { listMistakes, logMistake, updateMistake, deleteMistake } from '../api'

const CATEGORIES = ['concept', 'code', 'interview', 'quiz', 'math', 'other']
const CAT_COLORS = {
  concept: 'badge-cyan',
  code: 'badge-purple',
  interview: 'badge-orange',
  quiz: 'badge-blue',
  math: 'badge-green',
  other: 'badge-blue',
}

function ReviewDot({ done, date, label }) {
  const isPast = date && new Date(date) < new Date()
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
        done
          ? 'bg-emerald-500 border-emerald-500 text-white'
          : isPast
          ? 'bg-red-900/40 border-red-500 text-red-400'
          : 'bg-surface-elevated border-surface-border text-gray-500'
      }`}>
        {done ? '✓' : label}
      </div>
      {date && <span className="text-[10px] text-gray-500">{date}</span>}
    </div>
  )
}

function MistakeCard({ mistake, onReview, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const allDone = mistake.review_1_done && mistake.review_3_done && mistake.review_7_done

  return (
    <div className={`card-glow p-4 group ${mistake.resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${mistake.resolved ? 'bg-emerald-400' : 'bg-red-400 animate-pulse-slow'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{mistake.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={CAT_COLORS[mistake.category] || 'badge-blue'}>{mistake.category}</span>
                {mistake.source && <span className="text-xs text-gray-500">via {mistake.source}</span>}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onDelete(mistake.id)} className="btn-icon p-1.5 hover:text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <p className={`text-xs text-gray-400 mt-2 ${expanded ? '' : 'line-clamp-2'}`}>
            {mistake.description}
          </p>
          {mistake.description.length > 120 && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-primary-400 mt-1">
              {expanded ? 'Less ↑' : 'More ↓'}
            </button>
          )}

          {/* AI explanation */}
          {mistake.ai_explanation && (
            <div className="mt-3 p-3 rounded-xl bg-amber-900/10 border border-amber-800/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb size={12} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">AI Insight</span>
              </div>
              <p className="text-xs text-gray-300">{mistake.ai_explanation}</p>
            </div>
          )}

          {/* Spaced repetition tracker */}
          <div className="mt-3 pt-3 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ReviewDot
                  done={mistake.review_1_done}
                  date={mistake.review_1_date}
                  label="1"
                />
                <div className="w-8 h-px bg-surface-border" />
                <ReviewDot
                  done={mistake.review_3_done}
                  date={mistake.review_3_date}
                  label="3"
                />
                <div className="w-8 h-px bg-surface-border" />
                <ReviewDot
                  done={mistake.review_7_done}
                  date={mistake.review_7_date}
                  label="7"
                />
              </div>
              <div className="flex gap-1.5">
                {!mistake.review_1_done && (
                  <button
                    onClick={() => onReview(mistake.id, 1)}
                    className="text-xs px-2 py-1 rounded-lg bg-primary-900/30 text-primary-300 border border-primary-800/30 hover:bg-primary-600 transition-all"
                  >
                    Day 1
                  </button>
                )}
                {mistake.review_1_done && !mistake.review_3_done && (
                  <button
                    onClick={() => onReview(mistake.id, 3)}
                    className="text-xs px-2 py-1 rounded-lg bg-primary-900/30 text-primary-300 border border-primary-800/30 hover:bg-primary-600 transition-all"
                  >
                    Day 3
                  </button>
                )}
                {mistake.review_3_done && !mistake.review_7_done && (
                  <button
                    onClick={() => onReview(mistake.id, 7)}
                    className="text-xs px-2 py-1 rounded-lg bg-primary-900/30 text-primary-300 border border-primary-800/30 hover:bg-primary-600 transition-all"
                  >
                    Day 7
                  </button>
                )}
                {allDone && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={12} />Mastered!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddMistakeModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'concept', source: 'self-note'
  })
  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.description) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Log a Mistake</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">What went wrong? *</label>
            <input className="input" placeholder="e.g. Confused == vs is in Python"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Describe the mistake *</label>
            <textarea className="textarea h-24" placeholder="Explain what happened and what the correct approach should be..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
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
              <label className="label">Source</label>
              <input className="input" placeholder="quiz, interview..." value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Log & Get AI Insight
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MistakeLog() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filterResolved, setFilterResolved] = useState(false)

  const { data: mistakes = [], isLoading } = useQuery({
    queryKey: ['mistakes', filterResolved],
    queryFn: () => listMistakes({ resolved: filterResolved ? true : undefined }).then(r => r.data),
  })

  const addMut = useMutation({
    mutationFn: logMistake,
    onSuccess: () => {
      qc.invalidateQueries(['mistakes'])
      setShowAdd(false)
      toast.success('Mistake logged! Spaced review scheduled 📅')
    }
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateMistake(id, data),
    onSuccess: () => { qc.invalidateQueries(['mistakes']); toast.success('Review marked complete! ✅') }
  })

  const deleteMut = useMutation({
    mutationFn: deleteMistake,
    onSuccess: () => { qc.invalidateQueries(['mistakes']); toast.success('Removed') }
  })

  const handleReview = (id, day) => {
    const field = `review_${day}_done`
    updateMut.mutate({ id, data: { [field]: true } })
  }

  const pending = mistakes.filter(m => !m.resolved)
  const resolved = mistakes.filter(m => m.resolved)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Mistake Log</h2>
          <p className="section-subtitle">
            {pending.length} active · {resolved.length} resolved · 3-interval spaced repetition
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />Log Mistake
        </button>
      </div>

      {/* Info card */}
      <div className="card p-4 border-amber-800/30 bg-amber-900/10">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">Spaced Repetition System</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Each mistake gets scheduled for review on <strong className="text-gray-300">Day 1 → Day 3 → Day 7</strong>.
              Complete all 3 reviews to mark it as mastered and prevent future repetition.
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterResolved(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!filterResolved ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-surface-elevated'}`}
        >
          Active ({pending.length})
        </button>
        <button
          onClick={() => setFilterResolved(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterResolved ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-surface-elevated'}`}
        >
          Mastered ({resolved.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : mistakes.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl">🧠</span>
          <p className="text-white font-medium mt-3">
            {filterResolved ? 'No mastered mistakes yet' : 'No active mistakes!'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {filterResolved ? 'Keep reviewing to master your mistakes.' : 'Log mistakes from quizzes, interviews, or study sessions.'}
          </p>
          {!filterResolved && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
              <Plus size={16} />Log First Mistake
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map(m => (
            <MistakeCard
              key={m.id} mistake={m}
              onReview={handleReview}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}

      <AddMistakeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => addMut.mutate(data)}
        loading={addMut.isPending}
      />
    </div>
  )
}
