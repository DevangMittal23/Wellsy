'use client'

import { useState, useEffect } from 'react'
import { checkUsernameAvailable } from '@/actions/users'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function useUsernameCheck(username: string, currentUserId: string, originalUsername: string) {
  const [status, setStatus] = useState<UsernameStatus>('idle')

  useEffect(() => {
    // If unchanged from original, no need to check
    if (username === originalUsername) {
      setStatus('idle')
      return
    }

    if (username.length < 3) {
      setStatus(username.length === 0 ? 'idle' : 'invalid')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setStatus('invalid')
      return
    }

    setStatus('checking')
    const timeout = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username, currentUserId)
        setStatus(available ? 'available' : 'taken')
      } catch {
        setStatus('idle')
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeout)
  }, [username, currentUserId, originalUsername])

  return status
}
