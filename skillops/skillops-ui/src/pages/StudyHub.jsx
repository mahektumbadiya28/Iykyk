import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Heart, Bookmark, Sparkles, Link, FileText,
  Code, X, ChevronDown, ChevronUp, Loader2, BookMarked, Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import { listMaterials, createMaterial, updateMaterial, deleteMaterial, summarizeMaterial } from '../api'

const TYPE_ICONS = {
  article: FileText,
  snippet: Code,
  link: Link,
  doc: BookMarked,
  pdf: FileText,
}
const TYPE_COLORS = {
  article: 'badge-cyan',
  snippet: 'badge-purple',
  link: 'badge-blue',
  doc: 'badge-green',
  pdf: 'badge-orange',
}

function MaterialCard({ mat, onLike, onBookmark, onDelete, onSummarize, summarizing }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TYPE_ICONS[mat.material_type] || FileText

  return (
    <div className="card-glow p-4 group">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{mat.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={TYPE_COLORS[mat.material_type] || 'badge-blue'}>
                  {mat.material_type}
                </span>
                {mat.tags?.map(t => (
                  <span key={t} className="badge badge-blue text-[10px]"><Tag size={8} />{t}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onLike(mat)} className={`btn-icon p-1.5 ${mat.liked ? 'text-red-400' : ''}`}>
                <Heart size={14} fill={mat.liked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => onBookmark(mat)} className={`btn-icon p-1.5 ${mat.bookmarked ? 'text-amber-400' : ''}`}>
                <Bookmark size={14} fill={mat.bookmarked ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => onSummarize(mat.id)}
                disabled={summarizing === mat.id}
                className="btn-icon p-1.5 hover:text-purple-400"
                title="AI Summarize"
              >
                {summarizing === mat.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Sparkles size={14} />
                }
              </button>
              <button onClick={() => onDelete(mat.id)} className="btn-icon p-1.5 hover:text-red-400 opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {mat.url && (
            <a href={mat.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary-400 hover:underline mt-1 block truncate">
              🔗 {mat.url}
            </a>
          )}

          {mat.content && (
            <div className="mt-2">
              <p className={`text-xs text-gray-400 ${expanded ? '' : 'line-clamp-2'}`}>
                {mat.content}
              </p>
              {mat.content.length > 150 && (
                <button onClick={() => setExpanded(e => !e)} className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                  {expanded ? <><ChevronUp size={12} />Less</> : <><ChevronDown size={12} />More</>}
                </button>
              )}
            </div>
          )}

          {/* AI Summary section */}
          {mat.ai_summary && (
            <div className="mt-3 p-3 rounded-xl bg-purple-900/20 border border-purple-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} className="text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">AI Summary</span>
              </div>
              <p className="text-xs text-gray-300">{mat.ai_summary}</p>
              {mat.ai_key_points?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-purple-300 mb-1">Key Points:</p>
                  <ul className="space-y-1">
                    {mat.ai_key_points.map((pt, i) => (
                      <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                        <span className="text-purple-400 mt-0.5">•</span>{pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {mat.ai_flashcards?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-purple-300 mb-1">Flashcards ({mat.ai_flashcards.length}):</p>
                  <div className="space-y-1">
                    {mat.ai_flashcards.slice(0, 3).map((fc, i) => (
                      <div key={i} className="text-xs p-2 rounded-lg bg-surface-card border border-surface-border">
                        <span className="text-cyan-400 font-medium">Q: </span>
                        <span className="text-gray-300">{fc.q}</span>
                        <br />
                        <span className="text-emerald-400 font-medium">A: </span>
                        <span className="text-gray-400">{fc.a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddMaterialModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '', content: '', url: '', material_type: 'article', tags: ''
  })
  if (!open) return null
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: form.content || null,
      url: form.url || null,
    })
    setForm({ title: '', content: '', url: '', material_type: 'article', tags: '' })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Add Study Material</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="e.g. Python Async/Await Guide" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={form.material_type}
              onChange={e => setForm(f => ({ ...f, material_type: e.target.value }))}>
              {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">URL (optional)</label>
            <input className="input" placeholder="https://..." value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className="label">Content / Notes</label>
            <textarea className="textarea h-28" placeholder="Paste article content, code snippet, or your notes here for AI summarization..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" placeholder="python, async, web" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1"><Plus size={16} />Add Material</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StudyHub() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filterLiked, setFilterLiked] = useState(false)
  const [filterBookmarked, setFilterBookmarked] = useState(false)
  const [summarizing, setSummarizing] = useState(null)

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', filterLiked, filterBookmarked],
    queryFn: () => listMaterials({
      ...(filterLiked ? { liked: true } : {}),
      ...(filterBookmarked ? { bookmarked: true } : {}),
    }).then(r => r.data),
  })

  const addMut = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => { qc.invalidateQueries(['materials']); setShowAdd(false); toast.success('Material added! 📚') }
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateMaterial(id, data),
    onSuccess: () => qc.invalidateQueries(['materials'])
  })
  const deleteMut = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => { qc.invalidateQueries(['materials']); toast.success('Removed') }
  })

  const handleSummarize = async (id) => {
    setSummarizing(id)
    try {
      await summarizeMaterial(id)
      qc.invalidateQueries(['materials'])
      toast.success('AI summary generated! ✨')
    } catch {
      toast.error('Summarization failed. Check your API key.')
    }
    setSummarizing(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Study Hub</h2>
          <p className="section-subtitle">{materials.length} materials · Click ✨ to AI-summarize any resource</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex items-center gap-2">
        <button
          onClick={() => setFilterLiked(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            filterLiked ? 'bg-red-900/40 text-red-300 border border-red-800/40' : 'text-gray-400 hover:bg-surface-elevated'
          }`}
        >
          <Heart size={12} fill={filterLiked ? 'currentColor' : 'none'} />
          Liked
        </button>
        <button
          onClick={() => setFilterBookmarked(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            filterBookmarked ? 'bg-amber-900/40 text-amber-300 border border-amber-800/40' : 'text-gray-400 hover:bg-surface-elevated'
          }`}
        >
          <Bookmark size={12} fill={filterBookmarked ? 'currentColor' : 'none'} />
          Bookmarked
        </button>
        <span className="text-gray-500 text-xs ml-auto">
          💡 Add content then click <Sparkles size={10} className="inline text-purple-400" /> for AI summarization
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading materials...</div>
      ) : materials.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl">📖</span>
          <p className="text-white font-medium mt-3">No materials yet</p>
          <p className="text-gray-400 text-sm mt-1">Add articles, code snippets, or notes for AI-powered learning!</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
            <Plus size={16} />Add Material
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map(m => (
            <MaterialCard
              key={m.id} mat={m}
              onLike={(mat) => updateMut.mutate({ id: mat.id, data: { liked: !mat.liked } })}
              onBookmark={(mat) => updateMut.mutate({ id: mat.id, data: { bookmarked: !mat.bookmarked } })}
              onDelete={(id) => deleteMut.mutate(id)}
              onSummarize={handleSummarize}
              summarizing={summarizing}
            />
          ))}
        </div>
      )}

      <AddMaterialModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => addMut.mutate(data)}
      />
    </div>
  )
}
