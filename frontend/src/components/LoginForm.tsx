import { useState } from 'react'

interface LoginFormProps {
  onLogin: (username: string) => void
  error: string
}

export default function LoginForm({ onLogin, error }: LoginFormProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim().length === 0) return

    setLoading(true)
    setTimeout(() => {
      onLogin(input.trim())
      setLoading(false)
    }, 500)
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Chat App</h1>
          <p className="login-subtitle">Join the conversation</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            className="login-button"
            type="submit"
            disabled={loading || input.trim().length === 0}
          >
            {loading ? 'Connecting...' : 'Join Chat'}
          </button>
        </form>
      </div>
    </div>
  )
}
