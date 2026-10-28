import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mic, Play, ChevronRight, Trophy, AlertTriangle, CheckCircle,
  Loader2, Star, X, Send, Clock, BarChart2, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { listInterviews, startInterview, submitAnswer, completeInterview, getInterview } from '../api'

const DOMAINS = [
  { id: 'fullstack', label: 'Full-Stack Dev', icon: '🌐' },
  { id: 'devops', label: 'DevOps / Cloud', icon: '☁️' },
  { id: 'salesforce', label: 'Salesforce', icon: '⚡' },
  { id: 'python', label: 'Python / Backend', icon: '🐍' },
  { id: 'data', label: 'Data Engineering', icon: '📊' },
  { id: 'general', label: 'General Tech', icon: '💻' },
]
const JOB_ROLES = [
  'Junior Developer', 'DevOps Trainee', 'Salesforce Admin Intern',
  'Python Developer', 'Cloud Engineer', 'Software Engineer Intern'
]

function ScoreRing({ score, size = 80 }) {
  const pct = Math.min(10, Math.max(0, score))
  const radius = (size - 12) / 2
  const circ = 2 * Math.PI * radius
  const dash = (pct / 10) * circ
  const color = pct >= 8 ? '#10b981' : pct >= 6 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2a2a4a" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{pct.toFixed(1)}</span>
      </div>
    </div>
  )
}

export default function InterviewSim() {
  const qc = useQueryClient()
  const [phase, setPhase] = useState('idle') // idle | setup | active | results
  const [activeIV, setActiveIV] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastEval, setLastEval] = useState(null)
  const [config, setConfig] = useState({ job_role: 'Junior Developer', domain: 'fullstack' })

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => listInterviews().then(r => r.data),
  })

  const startMut = useMutation({
    mutationFn: startInterview,
    onSuccess: (res) => {
      setActiveIV(res.data)
      setCurrentQ(0)
      setAnswer('')
      setLastEval(null)
      setPhase('active')
    },
    onError: () => toast.error('Failed to start. Check backend & API key.')
  })

  const completeMut = useMutation({
    mutationFn: completeInterview,
    onSuccess: (res) => {
      setActiveIV(res.data)
      qc.invalidateQueries(['interviews'])
      setPhase('results')
    }
  })

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return
    setSubmitting(true)
    try {
      const res = await submitAnswer(activeIV.id, {
        question_index: currentQ,
        user_answer: answer
      })
      setLastEval(res.data.evaluation)
      // Refresh interview data
      const updated = await getInterview(activeIV.id)
      setActiveIV(updated.data)
    } catch {
      toast.error('Failed to evaluate answer')
    }
    setSubmitting(false)
  }

  const handleNext = () => {
    const nextQ = currentQ + 1
    const questions = activeIV?.questions || []
    if (nextQ >= questions.length) {
      completeMut.mutate(activeIV.id)
    } else {
      setCurrentQ(nextQ)
      setAnswer('')
      setLastEval(null)
    }
  }

  // ── IDLE ──
  if (phase === 'idle') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="section-title">Interview Simulator</h2>
          <p className="section-subtitle">15-min AI-powered mock interviews · Technical + Behavioral + Situational</p>
        </div>

        {/* Start card */}
        <div className="card p-8 text-center border-primary-800/30 bg-gradient-to-b from-primary-900/20">
          <div className="w-20 h-20 rounded-2xl bg-primary-900/40 border border-primary-700/40 flex items-center justify-center mx-auto mb-4 animate-float">
            <Mic size={36} className="text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Weekly Mock Interview</h3>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            AI asks 8 job-specific questions, evaluates your answers, and gives detailed feedback
          </p>
          <button onClick={() => setPhase('setup')} className="btn-primary text-base px-8 py-3">
            <Play size={18} />Start Interview
          </button>
        </div>

        {/* Past interviews */}
        {interviews.length > 0 && (
          <div>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart2 size={16} className="text-primary-400" />
              Past Interviews
            </h3>
            <div className="space-y-3">
              {interviews.slice(0, 5).map(iv => (
                <div key={iv.id} className="card p-4 flex items-center gap-4">
                  <ScoreRing score={iv.overall_score} size={56} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{iv.job_role}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge-purple badge text-[10px]">{iv.domain}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(iv.interview_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{iv.overall_score.toFixed(1)}/10</div>
                    <div className="text-xs text-gray-500">{iv.completed ? 'Completed' : 'Incomplete'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── SETUP ──
  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Configure Interview</h2>
          <button onClick={() => setPhase('idle')} className="btn-icon"><X size={16} /></button>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Job Role</label>
            <select className="select" value={config.job_role}
              onChange={e => setConfig(c => ({ ...c, job_role: e.target.value }))}>
              {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Domain / Specialization</label>
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setConfig(c => ({ ...c, domain: d.id }))}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    config.domain === d.id
                      ? 'bg-primary-900/40 border-primary-500 text-primary-200'
                      : 'bg-surface-elevated border-surface-border text-gray-400 hover:border-primary-500/40'
                  }`}
                >
                  <span className="text-lg mr-2">{d.icon}</span>{d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-elevated rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p>📋 <strong className="text-gray-300">8 questions</strong> — 4 technical + 2 behavioral + 2 situational</p>
            <p>⏱️ <strong className="text-gray-300">~15 minutes</strong> — take your time with each answer</p>
            <p>🤖 <strong className="text-gray-300">AI evaluates</strong> — detailed feedback after each answer</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPhase('idle')} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => startMut.mutate(config)}
              disabled={startMut.isPending}
              className="btn-primary flex-1"
            >
              {startMut.isPending
                ? <><Loader2 size={14} className="animate-spin" />Generating Questions...</>
                : <><Mic size={14} />Start Interview</>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ACTIVE INTERVIEW ──
  if (phase === 'active' && activeIV) {
    const questions = activeIV.questions || []
    const q = questions[currentQ]
    const totalQ = questions.length
    const progress = ((currentQ) / totalQ) * 100
    const hasAnswered = q?.user_answer && q.user_answer.length > 0
    const answerSubmitted = lastEval !== null

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Progress header */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{activeIV.job_role}</p>
              <p className="text-xs text-gray-400">{activeIV.domain} · Question {currentQ + 1} of {totalQ}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Take your time</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill bg-primary-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              <span className={`badge text-xs ${
                q?.type === 'technical' ? 'badge-cyan'
                : q?.type === 'behavioral' ? 'badge-purple'
                : 'badge-orange'
              }`}>
                {q?.type || 'technical'}
              </span>
            </div>
          </div>
          <p className="text-white font-medium text-lg leading-relaxed mb-6">{q?.question}</p>

          {!answerSubmitted ? (
            <>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="textarea h-40 mb-4"
                placeholder="Type your detailed answer here. Be specific, use examples, and explain your reasoning..."
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || submitting}
                className="btn-primary w-full"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" />Evaluating Answer...</>
                  : <><Send size={16} />Submit Answer for AI Evaluation</>
                }
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Your answer */}
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <p className="text-xs font-semibold text-gray-400 mb-1">Your Answer:</p>
                <p className="text-sm text-gray-300">{answer}</p>
              </div>

              {/* AI feedback */}
              {lastEval && (
                <div className="p-4 rounded-xl bg-primary-900/20 border border-primary-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-primary-300">AI Evaluation</span>
                    <ScoreRing score={lastEval.score} size={52} />
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{lastEval.feedback}</p>
                  {lastEval.strengths?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-emerald-400 font-semibold mb-1">✅ Strengths:</p>
                      <ul className="text-xs text-gray-400 space-y-0.5">
                        {lastEval.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {lastEval.weaknesses?.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-semibold mb-1">⚠️ To Improve:</p>
                      <ul className="text-xs text-gray-400 space-y-0.5">
                        {lastEval.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={completeMut.isPending}
                className="btn-primary w-full"
              >
                {completeMut.isPending
                  ? <><Loader2 size={14} className="animate-spin" />Generating Report...</>
                  : currentQ + 1 >= totalQ
                  ? <><Trophy size={16} />Complete Interview & Get Report</>
                  : <>Next Question <ChevronRight size={16} /></>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── RESULTS ──
  if (phase === 'results' && activeIV) {
    const score = activeIV.overall_score
    const grade = score >= 8 ? { label: 'Excellent', color: 'text-emerald-400', emoji: '🏆' }
      : score >= 6.5 ? { label: 'Good', color: 'text-cyan-400', emoji: '🎯' }
      : score >= 5 ? { label: 'Average', color: 'text-amber-400', emoji: '📚' }
      : { label: 'Needs Work', color: 'text-red-400', emoji: '💪' }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score banner */}
        <div className="card p-8 text-center border-primary-800/30 bg-gradient-to-b from-primary-900/20">
          <div className="text-5xl mb-2">{grade.emoji}</div>
          <div className={`text-6xl font-black mb-1 ${grade.color}`}>{score.toFixed(1)}/10</div>
          <p className="text-white text-xl font-bold">{grade.label}</p>
          <p className="text-gray-400 text-sm mt-1">{activeIV.job_role} · {activeIV.domain}</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle size={14} />Top Strengths
            </h4>
            <ul className="space-y-2">
              {activeIV.strengths?.map((s, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} />Areas to Improve
            </h4>
            <ul className="space-y-2">
              {activeIV.weaknesses?.map((w, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">!</span>{w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Improvement Plan */}
        {activeIV.improvement_plan && (
          <div className="card p-5 border-amber-800/30 bg-amber-900/10">
            <h4 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <Star size={14} />Personalized Improvement Plan
            </h4>
            <p className="text-sm text-gray-300 whitespace-pre-line">{activeIV.improvement_plan}</p>
          </div>
        )}

        {/* Per-question scores */}
        <div>
          <h4 className="font-semibold text-white mb-3 text-sm">Question Breakdown</h4>
          <div className="space-y-2">
            {activeIV.questions?.map((q, i) => (
              <div key={i} className="card p-3 flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <p className="text-xs text-gray-300 flex-1 truncate">{q.question}</p>
                <ScoreRing score={q.score || 0} size={36} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setPhase('idle')} className="btn-secondary flex-1">
            View History
          </button>
          <button onClick={() => setPhase('setup')} className="btn-primary flex-1">
            <RefreshCw size={14} />New Interview
          </button>
        </div>
      </div>
    )
  }

  return null
}
