import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

const USER_ID = 1  // Single-user mode (extend for auth)

// ─── USERS ────────────────────────────────────────────────────
export const getUser = () => api.get(`/users/${USER_ID}`)
export const updateUser = (data) => api.put(`/users/${USER_ID}`, data)
export const getDashboard = () => api.get(`/users/${USER_ID}/dashboard`)

// ─── TASKS ────────────────────────────────────────────────────
export const listTasks = (params = {}) => api.get('/tasks', { params: { user_id: USER_ID, ...params } })
export const createTask = (data) => api.post('/tasks', data, { params: { user_id: USER_ID } })
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)
export const getTodayReminders = () => api.get('/tasks/reminders/today', { params: { user_id: USER_ID } })

// ─── MATERIALS ────────────────────────────────────────────────
export const listMaterials = (params = {}) => api.get('/materials', { params: { user_id: USER_ID, ...params } })
export const createMaterial = (data) => api.post('/materials', data, { params: { user_id: USER_ID } })
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data)
export const deleteMaterial = (id) => api.delete(`/materials/${id}`)
export const summarizeMaterial = (id) => api.post(`/materials/${id}/summarize`)

// ─── QUIZ & PROGRESS ──────────────────────────────────────────
export const generateQuiz = () => api.get('/quiz/generate', { params: { user_id: USER_ID } })
export const submitQuiz = (data) => api.post('/quiz/submit', data, { params: { user_id: USER_ID } })
export const getScores = (days = 30) => api.get('/quiz/scores', { params: { user_id: USER_ID, days } })

// ─── MISTAKES ─────────────────────────────────────────────────
export const listMistakes = (params = {}) => api.get('/mistakes', { params: { user_id: USER_ID, ...params } })
export const logMistake = (data) => api.post('/mistakes', data, { params: { user_id: USER_ID } })
export const updateMistake = (id, data) => api.put(`/mistakes/${id}`, data)
export const deleteMistake = (id) => api.delete(`/mistakes/${id}`)
export const getDueMistakes = () => api.get('/mistakes/due-today', { params: { user_id: USER_ID } })

// ─── CHAT ─────────────────────────────────────────────────────
export const getChatHistory = () => api.get('/chat', { params: { user_id: USER_ID } })
export const sendMessage = (content, context = 'general') =>
  api.post('/chat', { content, context }, { params: { user_id: USER_ID } })
export const clearChat = () => api.delete('/chat', { params: { user_id: USER_ID } })

// ─── INTERVIEWS ───────────────────────────────────────────────
export const listInterviews = () => api.get('/interviews', { params: { user_id: USER_ID } })
export const startInterview = (data) => api.post('/interviews/start', data, { params: { user_id: USER_ID } })
export const submitAnswer = (interviewId, data) => api.post(`/interviews/${interviewId}/answer`, data)
export const completeInterview = (interviewId) => api.post(`/interviews/${interviewId}/complete`)
export const getInterview = (interviewId) => api.get(`/interviews/${interviewId}`)

// ─── JOBS ─────────────────────────────────────────────────────
export const getJobOpportunities = () => api.get('/jobs/opportunities', { params: { user_id: USER_ID } })
export const matchResume = (jobTitle, jobDescription) =>
  api.post('/jobs/match-resume', null, {
    params: { user_id: USER_ID, job_title: jobTitle, job_description: jobDescription }
  })

export default api
