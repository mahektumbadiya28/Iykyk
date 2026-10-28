import React from 'react'
import { Bell, Flame, Zap, RefreshCw } from 'lucide-react'
import useStore from '../store'
import { getDashboard } from '../api'

const pageTitles = {
  dashboard: 'Dashboard',
  tasks: 'Task Manager',
  study: 'Study Hub',
  quiz: 'Daily Quiz & Progress',
  mistakes: 'Mistake Log & Reviews',
  chat: 'AI Mentor Chat',
  interview: 'Interview Simulator',
  jobs: 'Job Opportunities',
}

export default function Header({ onNotifClick }) {
  const { activePage, user, dashboardData, setDashboardData, setUser } = useStore()
  const [refreshing, setRefreshing] = React.useState(false)

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await getDashboard()
      setUser(res.data.user)
      setDashboardData(res.data)
    } catch {}
    setRefreshing(false)
  }

  const pendingReviews = dashboardData?.stats?.pending_reviews || 0

  return (
    <header className="bg-surface-card border-b border-surface-border px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-white font-semibold text-base">{pageTitles[activePage] || 'SkillOps'}</h1>
        <p className="text-gray-500 text-xs">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900/20 border border-amber-800/30">
          <Flame size={14} className="text-amber-400" />
          <span className="text-amber-300 text-sm font-semibold">{user?.streak_count || 0}</span>
          <span className="text-amber-600 text-xs">streak</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900/20 border border-primary-800/30">
          <Zap size={14} className="text-primary-400" />
          <span className="text-primary-300 text-sm font-semibold">{user?.total_xp || 0}</span>
          <span className="text-primary-600 text-xs">XP</span>
        </div>

        {/* Refresh */}
        <button onClick={refresh} className="btn-icon" title="Refresh">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Notifications */}
        <button
          onClick={onNotifClick}
          className="btn-icon relative"
          title="Notifications"
        >
          <Bell size={18} />
          {pendingReviews > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingReviews}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
