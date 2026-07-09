'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { PulseType } from '@/types'

interface EditProfileState {
  displayName: string
  username: string
  bio: string
  avatarPreviewUrl: string | null // local preview before actual upload completes
  avatarFile: File | null
  selectedPulse: PulseType | null
}

interface EditProfileContextValue extends EditProfileState {
  setDisplayName: (v: string) => void
  setUsername: (v: string) => void
  setBio: (v: string) => void
  setAvatarPreview: (url: string | null, file: File | null) => void
  setSelectedPulse: (v: PulseType | null) => void
}

const EditProfileContext = createContext<EditProfileContextValue | null>(null)

export function EditProfileProvider({ 
  children, 
  initial 
}: { 
  children: ReactNode
  initial: { displayName: string; username: string; bio: string; avatarUrl: string | null; pulseType: PulseType | null }
}) {
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [username, setUsername] = useState(initial.username)
  const [bio, setBio] = useState(initial.bio)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(initial.avatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [selectedPulse, setSelectedPulse] = useState<PulseType | null>(initial.pulseType)

  const setAvatarPreview = (url: string | null, file: File | null) => {
    setAvatarPreviewUrl(url)
    setAvatarFile(file)
  }

  return (
    <EditProfileContext.Provider value={{
      displayName, username, bio, avatarPreviewUrl, avatarFile, selectedPulse,
      setDisplayName, setUsername, setBio, setAvatarPreview, setSelectedPulse,
    }}>
      {children}
    </EditProfileContext.Provider>
  )
}

export function useEditProfile() {
  const ctx = useContext(EditProfileContext)
  if (!ctx) throw new Error('useEditProfile must be used within EditProfileProvider')
  return ctx
}
