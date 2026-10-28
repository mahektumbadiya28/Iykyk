import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import {
  CheckSquare, BookOpen, Brain, AlertTriangle,
  Flame, Zap, Trophy, TrendingUp, Target, Clock
} from 'lucide-react'
import { getDashboard, getScores } from '../api'
import useStore from '../store'

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-primary-400', bg = 'bg-primary-900/20', border = 'border-primary-800/30' }) => (
  <div className={`stat-card border ${border} ${bg}`}>
    <div className="flex items-center justify-between">
      <Icon size={20} className={color} />
      <span className={`text-2xl font-bold text-white`}>{value}</span>
    </div>
    <div>
      <div className="text-sm font-medium text-gray-300">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-elevated border border-surface-border rounded-xl p-3 shadow-card text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { dashboardData } = useStore()
  const { data: scores } = useQuery({
    queryKey: ['scores'],
    queryFn: () => getScores(14).then(r => r.data),
  })

  const stats = dashboardData?.stats || {}
  const weeklyScores = dashboardData?.weekly_scores || []
  const pendingReviews = dashboardData?.pending_review_items || []
  const chartData = scores || weeklyScores

  const completionPct = stats.today_tasks_total
    ? Math.round((stats.today_tasks_done / stats.today_tasks_total) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="relative overflow-hidden card p-6 border-primary-800/30 bg-gradient-to-r from-primary-900/40 to-purple-900/20">
        <div className="absolute inset-0 bg-hero-glow opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="glow-dot bg-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">System Active</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {dashboardData?.user?.name || 'Learner'} 👋
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Your personal career OS is tracking your progress. Keep the momentum going!
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <span className="text-amber-300 font-semibold">{stats.streak || 0} day streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-primary-400" />
              <span className="text-primary-300 font-semibold">{stats.total_xp || 0} total XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label="Today's Tasks"
          value={`${stats.today_tasks_done || 0}/${stats.today_tasks_total || 0}`}
          sub={`${completionPct}% complete`}
          color="text-emerald-400"
          bg="bg-emerald-900/20"
          border="border-emerald-800/30"
        />
        <StatCard
          icon={BookOpen}
          label="Materials"
          value={stats.materials_count || 0}
          sub="study resources"
          color="text-cyan-400"
          bg="bg-cyan-900/20"
          border="border-cyan-800/30"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Reviews"
          value={stats.pending_reviews || 0}
          sub="due for revision"
          color="text-amber-400"
          bg="bg-amber-900/20"
          border="border-amber-800/30"
        />
        <StatCard
          icon={Trophy}
          label="Total Tasks"
          value={stats.completed_tasks || 0}
          sub={`of ${stats.total_tasks || 0} completed`}
          color="text-purple-400"
          bg="bg-purple-900/20"
          border="border-purple-800/30"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Quiz Score chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-400" />
                Quiz Score Trend
              </h3>
              <p className="text-xs text-gray-500">Last 14 days</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="quiz_score" name="Quiz Score"
                  stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-500 text-sm">
              Complete your first quiz to see your progress chart 📈
            </div>
          )}
        </div>

        {/* XP chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Daily XP Earned
            </h3>
            <p className="text-xs text-gray-500">This week</p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="xp_earned" name="XP" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-500 text-sm text-center">
              Earn XP by completing tasks & quizzes!
            </div>
          )}
        </div>
      </div>

      {/* Today's task progress + review reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task completion ring */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={16} className="text-emerald-400" />
            Today's Progress
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a4a" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#10b981" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPct * 2.513} 251.3`}
                  className="score-ring transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{completionPct}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-white">{stats.today_tasks_done || 0}</div>
                <div className="text-gray-400 text-sm">tasks completed</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-300">{stats.today_tasks_total || 0}</div>
                <div className="text-gray-500 text-sm">total today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending reviews */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            Pending Reviews
          </h3>
          {pendingReviews.length > 0 ? (
            <div className="space-y-2">
              {pendingReviews.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-900/10 border border-amber-900/30">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{r.category}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">🎉</span>
              <p className="text-gray-400 text-sm">No reviews due today!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
