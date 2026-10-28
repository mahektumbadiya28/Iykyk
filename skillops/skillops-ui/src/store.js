import { create } from 'zustand'

const useStore = create((set, get) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Active page/section
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Notifications
  notifications: [],
  addNotification: (notif) => set((s) => ({
    notifications: [{ id: Date.now(), ...notif }, ...s.notifications].slice(0, 20)
  })),
  clearNotification: (id) => set((s) => ({
    notifications: s.notifications.filter((n) => n.id !== id)
  })),

  // Dashboard stats
  dashboardData: null,
  setDashboardData: (data) => set({ dashboardData: data }),

  // Current interview session
  activeInterview: null,
  setActiveInterview: (iv) => set({ activeInterview: iv }),
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: (i) => set({ currentQuestionIndex: i }),

  // Quiz state
  activeQuiz: null,
  setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
  quizAnswers: [],
  setQuizAnswers: (answers) => set({ quizAnswers: answers }),
  quizResults: null,
  setQuizResults: (results) => set({ quizResults: results }),

  // Chat
  chatMessages: [],
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  chatLoading: false,
  setChatLoading: (v) => set({ chatLoading: v }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))

export default useStore
