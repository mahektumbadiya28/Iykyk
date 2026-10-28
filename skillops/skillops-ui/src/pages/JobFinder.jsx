import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Briefcase, MapPin, ExternalLink, Star, Zap, Filter,
  Loader2, RefreshCw, Sparkles, ChevronDown, ChevronUp,
  Target, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getJobOpportunities, matchResume } from '../api'
import useStore from '../store'

const DOMAIN_COLORS = {
  DevOps: 'badge-cyan',
  Salesforce: 'badge-orange',
  'Web Dev': 'badge-purple',
  Python: 'badge-green',
  Cloud: 'badge-blue',
  Data: 'badge-blue',
}
const TYPE_COLORS = {
  Internship: 'badge-purple',
  'Full-time': 'badge-green',
  'Part-time': 'badge-orange',
  Contract: 'badge-cyan',
}

function JobCard({ job, onMatch }) {
  const [expanded, setExpanded] = useState(false)

  const matchColor = job.match_score >= 85 ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/30'
    : job.match_score >= 70 ? 'text-amber-400 bg-amber-900/20 border-amber-800/30'
    : 'text-red-400 bg-red-900/20 border-red-800/30'

  return (
    <div className="card-glow p-5 group">
      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-900/60 to-purple-900/40 border border-primary-700/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{job.domain === 'DevOps' ? '☁️' : job.domain === 'Salesforce' ? '⚡' : '💻'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white text-sm">{job.title}</h3>
              <p className="text-primary-400 text-xs mt-0.5 font-medium">{job.company}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold flex-shrink-0 ${matchColor}`}>
              <Target size={11} />
              {job.match_score}% match
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={10} />{job.location}
            </span>
            <span className={TYPE_COLORS[job.type] || 'badge-blue'}>{job.type}</span>
            <span className={DOMAIN_COLORS[job.domain] || 'badge-blue'}>{job.domain}</span>
          </div>

          <p className={`text-xs text-gray-400 mt-2 ${expanded ? '' : 'line-clamp-2'}`}>
            {job.description}
          </p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mt-2">
            {job.skills_required?.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border text-gray-400">
                {s}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-1.5 px-3 text-xs flex-shrink-0"
            >
              <ExternalLink size={12} />Apply Now
            </a>
            <button
              onClick={() => onMatch(job)}
              className="btn-secondary py-1.5 px-3 text-xs flex-shrink-0"
            >
              <Sparkles size={12} />Resume Match
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResumeMatchModal({ job, onClose }) {
  const [result, setResult] = useState(null)
  const matchMut = useMutation({
    mutationFn: () => matchResume(job.title, job.description),
    onSuccess: (res) => setResult(res.data),
    onError: () => toast.error('Match failed. Check API key.')
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Resume Match Analysis</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-surface-elevated border border-surface-border">
          <p className="text-sm font-medium text-white">{job.title}</p>
          <p className="text-xs text-gray-400">{job.company}</p>
        </div>

        {!result ? (
          <button
            onClick={() => matchMut.mutate()}
            disabled={matchMut.isPending}
            className="btn-primary w-full"
          >
            {matchMut.isPending
              ? <><Loader2 size={14} className="animate-spin" />Analyzing...</>
              : <><Sparkles size={14} />Analyze My Profile</>
            }
          </button>
        ) : (
          <div className="space-y-4">
            {/* Match score */}
            <div className="text-center p-4 rounded-xl bg-primary-900/20 border border-primary-800/30">
              <div className="text-4xl font-black text-primary-300">{result.match_percentage}%</div>
              <p className="text-gray-400 text-sm">Resume Match Score</p>
            </div>

            {result.missing_skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 mb-2">⚠️ Missing Skills to Learn:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_skills.map(s => (
                    <span key={s} className="badge-red">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {result.highlight_skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-2">✅ Skills to Highlight:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.highlight_skills.map(s => (
                    <span key={s} className="badge-green">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {result.resume_tips?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-cyan-400 mb-2">💡 Resume Tips:</p>
                <ul className="space-y-1.5">
                  {result.resume_tips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-cyan-400">{i + 1}.</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.cover_letter_hook && (
              <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-800/30">
                <p className="text-xs font-semibold text-purple-300 mb-1">✍️ Cover Letter Hook:</p>
                <p className="text-xs text-gray-300 italic">"{result.cover_letter_hook}"</p>
              </div>
            )}

            <button onClick={() => setResult(null)} className="btn-secondary w-full text-xs">
              <RefreshCw size={12} />Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobFinder() {
  const { user } = useStore()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [filterDomain, setFilterDomain] = useState('all')

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await getJobOpportunities()
      setJobs(res.data.opportunities || [])
    } catch {
      toast.error('Failed to load opportunities. Check API key.')
    }
    setLoading(false)
  }

  const filteredJobs = filterDomain === 'all'
    ? jobs
    : jobs.filter(j => j.domain === filterDomain)

  const domains = ['all', ...new Set(jobs.map(j => j.domain))]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="section-title">Job Opportunity Finder</h2>
        <p className="section-subtitle">
          AI-curated roles matching your skills: {user?.skills?.join(', ') || 'Python, DevOps, Azure'}
        </p>
      </div>

      {/* Your skills */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <Star size={14} className="text-amber-400" />
            Your Skill Profile
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(user?.skills || ['Python', 'DevOps', 'Azure', 'Web Dev']).map(s => (
            <span key={s} className="badge badge-purple text-xs">{s}</span>
          ))}
        </div>
      </div>

      {/* Load button */}
      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl">🚀</span>
          <h3 className="text-white font-semibold mt-3">Find Your Next Role</h3>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            AI will scan for Junior Dev, DevOps Trainee, and Salesforce intern opportunities
            matched to your skill profile
          </p>
          <button onClick={loadJobs} disabled={loading} className="btn-primary px-8 py-3 text-base mx-auto">
            {loading
              ? <><Loader2 size={18} className="animate-spin" />Finding Opportunities...</>
              : <><Sparkles size={18} />Find Matching Jobs</>
            }
          </button>
        </div>
      ) : (
        <>
          {/* Filters + refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400 flex-shrink-0" />
            {domains.map(d => (
              <button
                key={d}
                onClick={() => setFilterDomain(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterDomain === d ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-surface-elevated'
                }`}
              >
                {d === 'all' ? 'All Domains' : d}
              </button>
            ))}
            <button onClick={loadJobs} disabled={loading} className="btn-icon ml-auto">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Sort by match */}
          <div className="space-y-3">
            {filteredJobs
              .sort((a, b) => b.match_score - a.match_score)
              .map((job, i) => (
                <JobCard
                  key={i}
                  job={job}
                  onMatch={(j) => setSelectedJob(j)}
                />
              ))}
          </div>
        </>
      )}

      {selectedJob && (
        <ResumeMatchModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  )
}
