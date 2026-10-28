import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Brain, Sparkles, CheckCircle, XCircle,
  Trophy, Loader2, RefreshCw, BarChart2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generateQuiz, submitQuiz, getScores } from '../api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function DailyQuiz() {
  const [phase, setPhase] = useState('idle') // idle | loading | quiz | results | history
  const [questions, setQuestions] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)

  const { data: scores } = useQuery({
    queryKey: ['scores'],
    queryFn: () => getScores(30).then(r => r.data),
  })

  const genMut = useMutation({
    mutationFn: generateQuiz,
    onSuccess: (res) => {
      setQuestions(res.data.questions || [])
      setSelectedAnswers({})
      setCurrentQ(0)
      setPhase('quiz')
    },
    onError: () => toast.error('Failed to generate quiz. Make sure backend is running!')
  })

  const submitMut = useMutation({
    mutationFn: (answers) => submitQuiz({ answers }),
    onSuccess: (res) => {
      setResults(res.data)
      setPhase('results')
    },
    onError: () => toast.error('Failed to submit quiz')
  })

  const handleSelect = (qIdx, option) => {
    setSelectedAnswers(a => ({ ...a, [qIdx]: option }))
  }

  const handleSubmit = () => {
    const answers = questions.map((_, i) => selectedAnswers[i] || '')
    submitMut.mutate(answers)
  }

  const allAnswered = questions.length > 0 && questions.every((_, i) => selectedAnswers[i])

  // ── IDLE ──
  if (phase === 'idle') {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="section-title">Daily Knowledge Check</h2>
          <p className="section-subtitle">Test what you've learned today · 5 AI-generated questions</p>
        </div>

        {/* Score history toggle */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-primary-400" />
            <h3 className="font-semibold text-white text-sm">30-Day Score History</h3>
          </div>
          {scores?.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={scores}>
                <defs>
                  <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="quiz_score" name="Score" stroke="#6366f1" strokeWidth={2} fill="url(#quizGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Complete your first quiz to see your history!</p>
          )}
        </div>

        <div className="card p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-900/40 border border-primary-800/40 flex items-center justify-center mx-auto mb-4 animate-float">
            <Brain size={36} className="text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Ready for today's quiz?</h3>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            {today} · AI will generate 5 personalized questions based on your today's study materials and tasks
          </p>
          <button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className="btn-primary text-base px-8 py-3 mx-auto"
          >
            {genMut.isPending
              ? <><Loader2 size={18} className="animate-spin" />Generating Quiz...</>
              : <><Sparkles size={18} />Start AI Quiz</>
            }
          </button>
        </div>
      </div>
    )
  }

  // ── QUIZ ──
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentQ]
    const progress = ((currentQ + 1) / questions.length) * 100

    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{Object.keys(selectedAnswers).length} answered</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill bg-primary-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="card p-6 animate-slide-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-900/60 border border-primary-700/40 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-300 font-bold text-sm">{currentQ + 1}</span>
            </div>
            <p className="text-white font-medium leading-relaxed">{q?.question}</p>
          </div>

          <div className="space-y-2.5">
            {q?.options?.map((opt, i) => {
              const label = OPTION_LABELS[i]
              const selected = selectedAnswers[currentQ] === label
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(currentQ, label)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                    selected
                      ? 'bg-primary-900/40 border-primary-500 text-primary-200 shadow-glow-sm'
                      : 'bg-surface-elevated border-surface-border text-gray-300 hover:border-primary-500/50 hover:text-white'
                  }`}
                >
                  <span className={`inline-flex w-6 h-6 rounded-md mr-3 text-xs items-center justify-center font-bold ${
                    selected ? 'bg-primary-500 text-white' : 'bg-surface-border text-gray-400'
                  }`}>{label}</span>
                  {opt.replace(/^[A-D]\)\s*/, '')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="btn-secondary"
          >
            ← Previous
          </button>

          <div className="flex gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  i === currentQ
                    ? 'bg-primary-600 text-white'
                    : selectedAnswers[i]
                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                    : 'bg-surface-elevated text-gray-500'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
              className="btn-primary"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMut.isPending}
              className="btn-success"
            >
              {submitMut.isPending
                ? <><Loader2 size={14} className="animate-spin" />Grading...</>
                : <><Trophy size={14} />Submit Quiz</>
              }
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── RESULTS ──
  if (phase === 'results' && results) {
    const pct = results.score
    const grade = pct >= 90 ? { label: 'A', color: 'text-emerald-400', emoji: '🏆' }
      : pct >= 70 ? { label: 'B', color: 'text-cyan-400', emoji: '🎯' }
      : pct >= 50 ? { label: 'C', color: 'text-amber-400', emoji: '📚' }
      : { label: 'D', color: 'text-red-400', emoji: '💪' }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score banner */}
        <div className="card p-8 text-center border-primary-800/30 bg-gradient-to-b from-primary-900/20">
          <div className="text-5xl mb-2">{grade.emoji}</div>
          <div className={`text-6xl font-black mb-2 ${grade.color}`}>{pct}%</div>
          <p className="text-white text-lg font-semibold">
            {results.correct}/{results.total} Correct · Grade {grade.label}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-amber-300 font-semibold">+{results.xp_earned} XP earned!</span>
          </div>
        </div>

        {/* Answer breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Answer Review</h3>
          {results.results?.map((r, i) => (
            <div key={i} className={`card p-4 border ${
              r.is_correct ? 'border-emerald-800/40 bg-emerald-900/10' : 'border-red-800/40 bg-red-900/10'
            }`}>
              <div className="flex items-start gap-3">
                {r.is_correct
                  ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <p className="text-sm font-medium text-white mb-1">{r.question}</p>
                  <p className="text-xs text-gray-400">
                    Your answer: <span className={r.is_correct ? 'text-emerald-400' : 'text-red-400'}>{r.user_answer || 'Not answered'}</span>
                    {!r.is_correct && <span className="text-gray-500"> · Correct: <span className="text-emerald-400">{r.correct_answer}</span></span>}
                  </p>
                  {r.explanation && (
                    <p className="text-xs text-gray-500 mt-1 italic">{r.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setPhase('idle'); setResults(null) }} className="btn-secondary flex-1">
            <BarChart2 size={16} />View History
          </button>
          <button onClick={() => { setPhase('idle'); genMut.mutate() }} className="btn-primary flex-1">
            <RefreshCw size={16} />New Quiz
          </button>
        </div>
      </div>
    )
  }

  return <div className="text-center py-16 text-gray-500"><Loader2 className="animate-spin mx-auto" /></div>
}
