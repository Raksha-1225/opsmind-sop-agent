import React, { useState, useRef, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('Email and password are required'); return }
    if (!isLogin && !form.name) { setError('Name is required'); return }
    setLoading(true)
    try {
      const url = isLogin ? `${API}/auth/login` : `${API}/auth/register`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch {
      setError('Cannot connect to server. Is backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '420px' }}>
      <div className="text-center mb-4">
        <h1 style={{ fontSize: '28px' }}>OpsMind AI</h1>
        <p className="text-muted">Enterprise SOP Agent</p>
      </div>
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">{isLogin ? 'Login' : 'Create Account'}</h5>
        {!isLogin && (
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input className="form-control" name="name" value={form.name} onChange={handle} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="John Doe" />
          </div>
        )}
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" name="email" type="email" value={form.email} onChange={handle} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="john@company.com" />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input className="form-control" name="password" type="password" value={form.password} onChange={handle} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Min 6 characters" />
        </div>
        {error && <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>{error}</div>}
        <button className="btn btn-primary w-100" onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
        </button>
        <p className="text-center mt-3 mb-0" style={{ fontSize: '13px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={{ color: '#0d6efd', cursor: 'pointer' }} onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}

function SourceModal({ source, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card p-4" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0">{source.title}</h5>
            <small className="text-muted">{source.category} · {source.filename}</small>
          </div>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap', border: '1px solid #dee2e6' }}>
          {source.content}
        </div>
        <button className="btn btn-outline-secondary btn-sm mt-3" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

function UploadPanel({ token, onClose }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sops, setSops] = useState([])

  useEffect(() => { fetchSops() }, [])

  const fetchSops = async () => {
    try {
      const res = await fetch(`${API}/sop/list`, { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      setSops(data.sops || [])
    } catch { }
  }

  const uploadFile = async () => {
    if (!file || !title) { setError('File and title are required'); return }
    setLoading(true); setError(''); setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('category', category)
      const res = await fetch(`${API}/sop/upload`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage(data.message); setFile(null); setTitle('')
      fetchSops()
    } catch { setError('Upload failed.') } finally { setLoading(false) }
  }

  const deleteSop = async (id) => {
    try {
      await fetch(`${API}/sop/` + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
      fetchSops()
    } catch { }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card p-4" style={{ width: '560px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">📄 Manage SOPs</h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="border rounded p-3 mb-3" style={{ background: '#f8f9fa' }}>
          <p className="mb-2" style={{ fontWeight: 500 }}>Upload New SOP</p>
          <div className="mb-2"><input className="form-control form-control-sm" placeholder="SOP Title e.g. Leave Policy" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="mb-2">
            <select className="form-select form-select-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option>General</option><option>Finance</option><option>HR</option>
              <option>IT</option><option>Support</option><option>Operations</option><option>Legal</option>
            </select>
          </div>
          <div className="mb-2">
            <input className="form-control form-control-sm" type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files[0])} />
            <small className="text-muted">Supported: PDF, DOCX, TXT (max 10MB)</small>
          </div>
          {error && <div className="alert alert-danger py-1 mb-2" style={{ fontSize: '12px' }}>{error}</div>}
          {message && <div className="alert alert-success py-1 mb-2" style={{ fontSize: '12px' }}>{message}</div>}
          <button className="btn btn-primary btn-sm w-100" onClick={uploadFile} disabled={loading}>{loading ? 'Uploading...' : 'Upload SOP'}</button>
        </div>
        <p className="mb-2" style={{ fontWeight: 500 }}>Uploaded SOPs ({sops.length})</p>
        {sops.length === 0 && <p className="text-muted" style={{ fontSize: '13px' }}>No SOPs uploaded yet.</p>}
        {sops.map(sop => (
          <div key={sop._id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{sop.title}</div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>{sop.category} · {sop.filename} · by {sop.uploadedBy}</div>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={() => deleteSop(sop._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryPanel({ token, onClose, onSelectQuestion }) {
  const [history, setHistory] = useState([])

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/chat/history`, { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      setHistory(data.history || [])
    } catch { }
  }

  const clearHistory = async () => {
    try {
      await fetch(`${API}/chat/history`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
      setHistory([])
    } catch { }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card p-4" style={{ width: '560px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">🕓 Chat History</h5>
          <div className="d-flex gap-2">
            {history.length > 0 && <button className="btn btn-outline-danger btn-sm" onClick={clearHistory}>Clear All</button>}
            <button className="btn-close" onClick={onClose} />
          </div>
        </div>
        {history.length === 0 && <p className="text-muted" style={{ fontSize: '13px' }}>No history yet.</p>}
        {history.map((h, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #dee2e6', cursor: 'pointer' }}
            onClick={() => { onSelectQuestion(h.question); onClose() }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d6efd' }}>{h.question}</div>
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
              {h.sources && h.sources.map(s => s.title).join(', ')} · {new Date(h.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Chat({ user, onLogout }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedSource, setSelectedSource] = useState(null)
  const eventSourceRef = useRef(null)
  const bottomRef = useRef(null)
  const token = localStorage.getItem('token')

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const ask = (q) => {
    const qText = q || question
    if (!qText.trim() || qText.trim().length < 3) { setError('Please enter a valid question.'); return }
    if (eventSourceRef.current) eventSourceRef.current.close()

    setMessages(prev => [...prev, { role: 'user', text: qText }, { role: 'ai', text: '', sources: [] }])
    setQuestion('')
    setError('')
    setLoading(true)
    setStreaming(true)

    const url = `${API}/stream?question=` + encodeURIComponent(qText) + '&token=' + token
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (e) => {
      if (e.data === '[DONE]') {
        eventSource.close()
        setLoading(false)
        setStreaming(false)
        scrollToBottom()
        return
      }
      try {
        const parsed = JSON.parse(e.data)
        if (parsed.error) { setError(parsed.error); setLoading(false); setStreaming(false); eventSource.close(); return }
        if (parsed.sources) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], sources: parsed.sources }
            return updated
          })
        }
        if (parsed.token) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + parsed.token }
            return updated
          })
          scrollToBottom()
        }
      } catch { }
    }

    eventSource.onerror = () => {
      setError('Connection lost. Please try again.')
      setLoading(false)
      setStreaming(false)
      eventSource.close()
    }
  }

  return (
    <div className="container mt-4" style={{ maxWidth: '700px' }}>
      {showUpload && <UploadPanel token={token} onClose={() => setShowUpload(false)} />}
      {showHistory && <HistoryPanel token={token} onClose={() => setShowHistory(false)} onSelectQuestion={(q) => { setQuestion(q) }} />}
      {selectedSource && <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-0" style={{ fontSize: '24px' }}>OpsMind AI</h1>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Welcome, <strong>{user.name}</strong></p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowUpload(true)}>📄 SOPs</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowHistory(true)}>🕓 History</button>
          {messages.length > 0 && <button className="btn btn-outline-secondary btn-sm" onClick={() => setMessages([])}>Clear</button>}
          <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={{ height: '460px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#f8f9fa' }}>
        {messages.length === 0 && (
          <div className="text-center text-muted mt-4">
            <p style={{ fontSize: '32px' }}>🧠</p>
            <p>Ask anything about your SOPs</p>
            <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
              {['How do I process a refund?', 'Employee onboarding steps?', 'How to handle complaints?', 'Data backup procedure?'].map(q => (
                <button key={q} className="btn btn-outline-primary btn-sm" onClick={() => ask(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={'d-flex mb-3 ' + (msg.role === 'user' ? 'justify-content-end' : 'justify-content-start')}>
            <div style={{ maxWidth: '85%' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? '#0d6efd' : '#ffffff',
                color: msg.role === 'user' ? '#fff' : '#212529',
                border: msg.role === 'ai' ? '1px solid #dee2e6' : 'none',
                fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
                {msg.role === 'ai' && streaming && i === messages.length - 1 && (
                  <span style={{ display: 'inline-block', width: '2px', height: '14px', background: '#000', marginLeft: '2px', animation: 'blink 1s infinite', verticalAlign: 'middle' }} />
                )}
                {msg.role === 'ai' && loading && msg.text === '' && <span className="spinner-border spinner-border-sm" role="status" />}
              </div>

              {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-1">
                  <small className="text-muted me-1" style={{ fontSize: '11px', lineHeight: '24px' }}>Sources:</small>
                  {msg.sources.map((src, j) => (
                    <button key={j} onClick={() => setSelectedSource(src)}
                      style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: '#e7f3ff', color: '#0d6efd', border: '1px solid #b6d4fe', cursor: 'pointer', fontWeight: 500 }}>
                      {src.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div className="alert alert-danger alert-dismissible py-2">{error}<button className="btn-close" onClick={() => setError('')} /></div>}

      <div className="d-flex gap-2">
        <input className="form-control" value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask about your SOPs..." disabled={loading} />
        <button className="btn btn-primary" onClick={() => ask()} disabled={loading || !question.trim()} style={{ whiteSpace: 'nowrap' }}>
          {loading ? '...' : 'Ask'}
        </button>
        {streaming && <button className="btn btn-outline-danger" onClick={() => { eventSourceRef.current?.close(); setLoading(false); setStreaming(false) }}>Stop</button>}
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  )
}

export default function Context() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!user) return <AuthForm onLogin={setUser} />
  return <Chat user={user} onLogout={handleLogout} />
}