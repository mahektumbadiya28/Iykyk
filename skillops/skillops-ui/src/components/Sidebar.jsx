import React from 'react'
import {
  LayoutDashboard, CheckSquare, BookOpen, Brain,
  AlertTriangle, MessageSquare, Mic, Briefcase,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import useStore from '../store'

const navItems = [
  { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'tasks',     label: 'Tasks',            icon: CheckSquare },
  { id: 'study',     label: 'Study Hub',        icon: BookOpen },
  { id: 'quiz',      label: 'Daily Quiz',       icon: Brain },
  { id: 'mistakes',  label: 'Mistake Log',      icon: AlertTriangle },
  { id: 'chat',      label: 'AI Mentor',        icon: MessageSquare },
  { id: 'interview', label: 'Interview Sim',    icon: Mic },
  { id: 'jobs',      label: 'Job Finder',       icon: Briefcase },
]

export default function Sidebar() {
  const { activePage, setActivePage, sidebarCollapsed, toggleSidebar, user } = useStore()

  return (
    <aside
      className={`
        flex flex-col bg-surface-card border-r border-surface-border
        transition-all duration-300 ease-in-out flex-shrink-0
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-glow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">SkillOps</div>
              <div className="text-gray-500 text-xs">Career OS</div>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-glow-sm mx-auto">
            <Zap size={16} className="text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="btn-icon ml-auto"
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={14} />
            : <ChevronLeft size={14} />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={`w-full text-left ${activePage === id ? 'nav-item-active' : 'nav-item-inactive'}`}
            title={sidebarCollapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-surface-border">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: user?.avatar_color || '#6366f1' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'L'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name || 'Learner'}</div>
              <div className="text-gray-500 text-xs flex items-center gap-1">
                <Zap size={10} className="text-amber-400" />
                {user?.total_xp || 0} XP
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto"
            style={{ background: user?.avatar_color || '#6366f1' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'L'}
          </div>
        )}
      </div>
    </aside>
  )
}
