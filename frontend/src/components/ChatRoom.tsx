import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'

interface Message {
  text: string
  timestamp: Date
  isOwn: boolean
  isServer: boolean
  sender?: string
  target?: string
}

interface ChatRoomProps {
  username: string
  conversations: { public: Message[]; [privateUser: string]: Message[] }
  currentConv: string
  setCurrentConv: Dispatch<SetStateAction<string>>
  onlineUsers: string[]
  onSendMessage: (message: string, target: string) => void
  onDisconnect: () => void
}

export default function ChatRoom({
  username,
  conversations,
  currentConv,
  setCurrentConv,
  onlineUsers,
  onSendMessage,
  onDisconnect,
}: ChatRoomProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConv, conversations])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim().length === 0) return

    let messageToSend = input.trim()

    onSendMessage(messageToSend, currentConv)
    setInput('')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="chat-container">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-status">
            <div className="status-indicator"></div>
            <span className="username">{username}</span>
          </div>
          <p className="connection-status">Connected</p>
        </div>

        <div className="online-users">
          <h3 className="online-users-title">Online Users ({onlineUsers.length})</h3>
          <div className="users-list">
            {onlineUsers.length === 0 ? (
              <p className="users-empty">No users online</p>
            ) : (
              onlineUsers.map((user) => (
                <button
                  key={user}
                  className={`user-button ${currentConv === user ? 'active' : ''}`}
                  onClick={() => setCurrentConv(user === currentConv ? 'public' : user)}
                >
                  <span className="user-dot"></span>
                  {user}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            className="action-button disconnect-button"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <h2 className="chat-title">
            {currentConv !== 'public' ? `Private Chat with ${currentConv}` : 'Public Chat'}
          </h2>
          {currentConv !== 'public' && (
            <p className="chat-subtitle">
              <button
                className="switch-chat-button"
                onClick={() => setCurrentConv('public')}
              >
                Switch to public chat
              </button>
            </p>
          )}
        </header>

        <div className="messages-container">
          {(conversations[currentConv] || []).length === 0 ? (
            <div className="messages-empty">
              <div>
                <p className="empty-title">No messages yet</p>
                <p className="empty-subtitle">
                  {currentConv !== 'public'
                    ? `Start a conversation with ${currentConv}`
                    : 'Start chatting to connect with others'}
                </p>
              </div>
            </div>
          ) : (
            (conversations[currentConv] || []).map((msg, idx) => (
              <div key={idx} className={`message ${msg.isOwn ? 'own' : ''}`}>
                <div
                  className={`message-bubble ${
                    msg.isServer
                      ? 'server'
                      : msg.isOwn
                        ? 'own'
                        : 'other'
                  }`}
                >
                  {msg.sender && !msg.isServer && (
                    <div className="message-sender">{msg.sender}</div>
                  )}
                  <div>{msg.text}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <form className="chat-form" onSubmit={handleSendMessage}>
            {currentConv !== 'public' && (
              <div className="private-indicator">
                <span>
                  Sending private message to <strong>{currentConv}</strong>
                </span>
                <button
                  type="button"
                  className="private-close"
                  onClick={() => setCurrentConv('public')}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="input-group">
              <input
                type="text"
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  currentConv !== 'public'
                    ? `Message ${currentConv}...`
                    : 'Type a message'
                }
              />
              <button
                type="submit"
                className="send-button"
                disabled={input.trim().length === 0}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
