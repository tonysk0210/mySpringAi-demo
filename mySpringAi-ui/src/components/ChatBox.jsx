import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import apiClient from '../api/client'
import { useDemo } from '../context/useDemo'

function responseToText(data) {
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2)
}

function errorToText(error) {
  if (axios.isCancel(error)) return null
  if (error.response) {
    const detail = responseToText(error.response.data)
    return `HTTP ${error.response.status}${detail ? `\n${detail}` : ''}`
  }
  if (error.request) return '無法連線到後端服務，請確認 Spring Boot 是否已啟動。'
  return error.message || '建立請求時發生錯誤。'
}

function ChatBox({ title, description, endpoint, requiresUserName = false }) {
  const { userName, messagesByUserAndEndpoint, setMessagesByUserAndEndpoint } = useDemo()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const controllerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const userKey = userName.trim() || 'anonymous'
  const messages = useMemo(
    () => messagesByUserAndEndpoint[userKey]?.[endpoint] || [],
    [endpoint, messagesByUserAndEndpoint, userKey],
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => () => controllerRef.current?.abort(), [])

  function appendMessage(message) {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [endpoint]: [...(current[userKey]?.[endpoint] || []), message],
      },
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const message = input.trim()
    if (!message || isLoading) return
    if (requiresUserName && !userName.trim()) {
      setValidationError('請先在左側 Demo userName 輸入使用者名稱。')
      return
    }

    setValidationError('')
    setInput('')
    appendMessage({ role: 'user', content: message })
    setIsLoading(true)
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const response = await apiClient.post(
        endpoint,
        { message },
        {
          headers: requiresUserName ? { userName: userName.trim() } : undefined,
          signal: controller.signal,
        },
      )
      appendMessage({ role: 'assistant', content: responseToText(response.data) })
    } catch (error) {
      const errorMessage = errorToText(error)
      if (errorMessage) appendMessage({ role: 'error', content: errorMessage })
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function clearMessages() {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [endpoint]: [],
      },
    }))
  }

  return (
    <article className="api-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">POST ENDPOINT</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <code>{endpoint}</code>
      </header>

      <section className="chat-panel">
        <div className="chat-toolbar">
          <div>
            <span className="status-dot" /> Ready
            {requiresUserName && <span className="user-chip">user: {userName || 'not set'}</span>}
          </div>
          <button type="button" onClick={clearMessages} disabled={!messages.length || isLoading}>Clear</button>
        </div>

        <div className="messages" aria-live="polite">
          {!messages.length && (
            <div className="empty-chat">
              <span>✦</span>
              <h2>Start testing this endpoint</h2>
              <p>Type a message below to send your first request.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <strong>{message.role === 'user' ? 'You' : message.role === 'error' ? 'Error' : 'Assistant'}</strong>
              <pre>{message.content}</pre>
            </div>
          ))}
          {isLoading && <div className="message assistant typing"><i /><i /><i /></div>}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {validationError && <p className="validation-error">{validationError}</p>}
          <div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a message…"
              rows="3"
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
              {isLoading ? '…' : '↑'}
            </button>
          </div>
          <small>Enter to send · Shift + Enter for a new line</small>
        </form>
      </section>
    </article>
  )
}

export default ChatBox
