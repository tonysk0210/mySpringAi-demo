import { createContext, useContext } from 'react'

export const DemoContext = createContext(null)

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemo must be used inside DemoProvider')
  return context
}
