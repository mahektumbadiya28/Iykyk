import React, { useEffect } from 'react'
import { X, AlertTriangle, Bell, CheckCircle, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getDueMistakes, getTodayReminders } from '../api'
import useStore from '../store'

export default function NotificationPanel({ onClose }) {
  const { data: mistakes } = useQuery({
    queryKey: ['due-mistakes'],
    queryFn: () => getDueMistakes().then(r => r.data),
  })
  const { data: reminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => getTodayReminders().then(r => r.data),
  })

  const hasMistakes = mistakes?.length > 0
  const hasReminders = reminders?.length > 0

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" onClick={onClose} />
      <div className="w-80 h-full bg-surface-card border-l border-surface-border shadow-2xl animate-slide-up flex flex-col">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary-400" />
            <span className="font-semibold text-white text-sm">Notifications</span>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Spaced Review Reminders */}
          {hasMistakes && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider px-1">
                📚 Spaced Repetition Due Today
              </p>
              {mistakes.map(m => (
                <div key={m.id} className="flex gap-3 p-3 rounded-xl bg-amber-900/20 border border-amber-800/30">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">{m.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task Reminders */}
          {hasReminders && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider px-1 mt-3">
                ⏰ Tasks Due Today
              </p>
              {reminders.map(r => (
                <div key={r.id} className="flex gap-3 p-3 rounded-xl bg-red-900/20 border border-red-800/30">
                  <Calendar size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{r.priority} priority</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasMistakes && !hasReminders && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle size={40} className="text-emerald-400 mb-3" />
              <p className="text-white font-medium">All clear!</p>
              <p className="text-gray-400 text-sm mt-1">No pending reviews or tasks due today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
