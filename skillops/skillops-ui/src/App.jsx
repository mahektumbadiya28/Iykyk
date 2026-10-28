import React, { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import StudyHub from './pages/StudyHub'
import DailyQuiz from './pages/DailyQuiz'
import MistakeLog from './pages/MistakeLog'
import AIChat from './pages/AIChat'
import InterviewSim from './pages/InterviewSim'
import JobFinder from './pages/JobFinder'
import useStore from './store'
import { getDashboard } from './api'
import NotificationPanel from './components/NotificationPanel'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

const PAGES = {
  dashboard: Dashboard,
  tasks: Tasks,
  study: StudyHub,
  quiz: DailyQuiz,
  mistakes: MistakeLog,
  chat: AIChat,
  interview: InterviewSim,
  jobs: JobFinder,
}

function App() {
  const { activePage, setUser, setDashboardData, sidebarCollapsed } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    getDashboard()
      .then((res) => {
        setUser(res.data.user)
        setDashboardData(res.data)
      })
      .catch(() => {/* backend not ready yet */})
  }, [])

  const PageComponent = PAGES[activePage] || Dashboard

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header onNotifClick={() => setShowNotifications(v => !v)} />
          <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
            <PageComponent />
          </main>
        </div>

        {/* Notification slide-over */}
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#f3f4f6',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
