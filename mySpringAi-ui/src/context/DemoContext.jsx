import { useEffect, useMemo, useState } from 'react'
import { DemoContext } from './useDemo'

const USER_NAME_KEY = 'myspringai:userName'
const MESSAGES_KEY = 'myspringai:messages'
function readMessages() {
  try {
    return JSON.parse(sessionStorage.getItem(MESSAGES_KEY)) || {}
  } catch {
    return {}
  }
}

export function DemoProvider({ children }) {
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem(USER_NAME_KEY) || 'demo-user',
  )
  const [messagesByEndpoint, setMessagesByEndpoint] = useState(readMessages)

  useEffect(() => {
    sessionStorage.setItem(USER_NAME_KEY, userName)
  }, [userName])

  useEffect(() => {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messagesByEndpoint))
  }, [messagesByEndpoint])

  const value = useMemo(
    () => ({ userName, setUserName, messagesByEndpoint, setMessagesByEndpoint }),
    [userName, messagesByEndpoint],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
