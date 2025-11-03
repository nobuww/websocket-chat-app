import { useState, useRef } from 'react'
import './index.css'
import LoginForm from './components/LoginForm.tsx'
import ChatRoom from './components/ChatRoom.tsx'

interface Message {
  text: string
  timestamp: Date
  isOwn: boolean
  isServer: boolean
  sender?: string
  target?: string
}

function App() {
  const [username, setUsername] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const ws = useRef<WebSocket | null>(null)
  const [error, setError] = useState<string>('')
  const [conversations, setConversations] = useState<{
    public: Message[]
    [privateUser: string]: Message[]
  }>({
    public: []
  });
  const [currentConv, setCurrentConv] = useState<string>('public')

  const parseMessage = (text: string): { 
    tag?: string; 
    body: string; 
    isServer: boolean; 
    sender?: string; 
    target?: string 
  } => {
    if (text.startsWith('[server]')) {
      return { tag: '[server]', body: text.substring(8).trim(), isServer: true, sender: 'Server', target: 'public' }
    }
    const tagMatch = text.match(/^\[([^\]]+)\]/)
    if (tagMatch) {
      const tag = tagMatch[1]
      const body = text.substring(tagMatch[0].length).trim()
      const parts = tag.split(' ->')
      const sender = parts[0]?.trim()
      const target = parts[1]?.trim()
      return { tag, body, isServer: false, sender, target }
    }
    return { body: text, isServer: false }
  }

  const getConversationKey = (sender: string | undefined, target: string | undefined): string => {
    if (target === 'you') {
      return sender || 'public'
    } else if (target === 'all') {
      return 'public'
    }
    return 'public'
  }

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:5000`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      console.log('Connected to chat server')
      setConnected(true)
      setConversations({ public: [] })
      setError('')
    }

    ws.current.onmessage = (event: MessageEvent) => {
      const text = event.data
      
      let jsonMessage: any = null
      try {
        jsonMessage = JSON.parse(text)
      } catch (e) { }

      if (jsonMessage && jsonMessage.type === 'userlist') {
        setOnlineUsers(jsonMessage.users || [])
        return
      }

      const parsed = parseMessage(text)
      const convKey = getConversationKey(parsed.sender, parsed.target)
      
      const newMessage: Message = {
        text: parsed.body,
        timestamp: new Date(),
        isOwn: false,
        isServer: parsed.isServer,
        sender: parsed.sender,
        target: parsed.target,
      }
      
      setConversations((prev) => ({
        ...prev,
        [convKey]: [...(prev[convKey] || []), newMessage],
      }))
    }

    ws.current.onerror = (event: Event) => {
      console.error('WebSocket error:', event)
      setError('Connection error')
    }

    ws.current.onclose = () => {
      console.log('Disconnected from chat server')
      setConnected(false)
      setUsername(null)
    }
  }

  const handleLogin = (user: string) => {
    setUsername(user)
    connectWebSocket()
    setTimeout(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(user)
      }
    }, 100)
  }

  const handleSendMessage = (message: string, target: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messagePayload = JSON.stringify({
        type: 'message',
        body: message,
        target: target === 'public' ? 'all' : target,
      })
      ws.current.send(messagePayload)
      
      const newMessage: Message = {
        text: message,
        timestamp: new Date(),
        isOwn: true,
        isServer: false,
        sender: username || undefined,
        target: target === 'public' ? 'all' : target,
      }
      
      setConversations((prev) => ({
        ...prev,
        [target]: [...(prev[target] || []), newMessage],
      }))
    }
  }

  const handleDisconnect = () => {
    if (ws.current) {
      ws.current.send('/quit')
      ws.current.close()
    }
  }

  return (
    <div className="app-container">
      {!username || !connected ? (
        <LoginForm onLogin={handleLogin} error={error} />
      ) : (
        <ChatRoom
          username={username}
          conversations={conversations}
          currentConv={currentConv}
          setCurrentConv={setCurrentConv}
          onlineUsers={onlineUsers}
          onSendMessage={handleSendMessage}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  )
}

export default App
