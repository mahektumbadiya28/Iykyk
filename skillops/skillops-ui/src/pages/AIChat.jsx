import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send, Trash2, Bot, User, Loader2, Sparkles, Code, Copy, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { getChatHistory, sendMessage, clearChat } from '../api'
import useStore from '../store'

const QUICK_PROMPTS = [
  "Explain async/await in Python",
  "How does Docker containerization work?",
  "What are Kubernetes pods and services?",
  "Explain Azure DevOps pipelines",
  "What is REST vs GraphQL?",
  "How to prepare for a technical interview?",
  "Explain SQL JOINs with examples",
  "What is the difference between Git merge and rebase?",
]

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? 'bg-primary-600' : 'bg-surface-elevated border border-surface-border'
      }`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-primary-400" />}
      </div>

      {/* Content */}
      <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
        {isUser ? (
          <p className="text-sm text-gray-100">{msg.content}</p>
        ) : (
          <div className="text-sm text-gray-200 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  if (inline) return <code className="bg-surface-elevated px-1.5 py-0.5 rounded text-primary-300 font-mono text-xs">{children}</code>
                  return (
                    <div className="relative mt-2 mb-2">
                      <div className="flex items-center justify-between bg-surface px-3 py-1.5 rounded-t-lg border border-surface-border border-b-0">
                        <span className="text-xs text-gray-500 font-mono">{className?.replace('language-', '') || 'code'}</span>
                        <button onClick={() => copyCode(String(children))} className="btn-icon p-1">
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <pre className="bg-surface border border-surface-border rounded-b-lg p-3 overflow-x-auto">
                        <code className="text-xs text-gray-300 font-mono">{children}</code>
                      </pre>
                    </div>
                  )
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        <div className="text-[10px] text-gray-600 mt-1.5">
          {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export default function AIChat() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [context, setContext] = useState('general')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { chatLoading, setChatLoading } = useStore()

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['chat'],
    queryFn: () => getChatHistory().then(r => r.data),
  })

  const sendMut = useMutation({
    mutationFn: ({ content, ctx }) => sendMessage(content, ctx),
    onMutate: () => setChatLoading(true),
    onSuccess: () => { refetch(); setChatLoading(false) },
    onError: () => { setChatLoading(false); toast.error('Failed to send. Check backend.') }
  })

  const clearMut = useMutation({
    mutationFn: clearChat,
    onSuccess: () => { qc.invalidateQueries(['chat']); toast.success('Chat cleared') }
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const handleSend = () => {
    if (!input.trim() || chatLoading) return
    sendMut.mutate({ content: input.trim(), ctx: context })
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Bot size={22} className="text-primary-400" />
            AI Mentor
          </h2>
          <p className="section-subtitle">Powered by Groq · Always available · Expert in DevOps, Python, Azure & more</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={context}
            onChange={e => setContext(e.target.value)}
            className="select py-1.5 text-xs w-32"
          >
            <option value="general">General</option>
            <option value="interview">Interview Prep</option>
            <option value="quiz">Quiz Review</option>
          </select>
          {messages.length > 0 && (
            <button onClick={() => clearMut.mutate()} className="btn-secondary py-1.5 px-3 text-xs">
              <Trash2 size={12} />Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-900/40 border border-primary-800/40 flex items-center justify-center mx-auto mb-4 animate-float">
              <Sparkles size={28} className="text-primary-400" />
            </div>
            <h3 className="text-white font-semibold">Meet Your AI Mentor</h3>
            <p className="text-gray-400 text-sm mt-1 mb-6">Ask anything about tech, career, or your study topics</p>
            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
              {QUICK_PROMPTS.slice(0, 6).map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p); inputRef.current?.focus() }}
                  className="text-left text-xs p-3 rounded-xl bg-surface-elevated border border-surface-border hover:border-primary-500/50 hover:text-white text-gray-400 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-primary-400" />
                </div>
                <div className="bubble-ai">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary-400" />
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 flex-shrink-0">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => { setInput(p); inputRef.current?.focus() }}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-surface-elevated border border-surface-border hover:border-primary-500/50 text-gray-400 hover:text-white transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI mentor anything... (Enter to send, Shift+Enter for newline)"
            className="textarea pr-4 resize-none h-12 min-h-[48px] leading-tight"
            style={{ paddingTop: '14px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || chatLoading}
          className="btn-primary px-4 flex-shrink-0 self-end h-12"
        >
          {chatLoading
            ? <Loader2 size={16} className="animate-spin" />
            : <Send size={16} />
          }
        </button>
      </div>
    </div>
  )
}
