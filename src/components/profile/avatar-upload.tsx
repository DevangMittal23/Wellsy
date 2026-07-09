'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useEditProfile } from './edit-profile-context'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function AvatarUpload({ displayName }: { displayName: string }) {
  const { avatarPreviewUrl, setAvatarPreview } = useEditProfile()
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = getInitials(displayName || "User")

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WebP, or GIF image')
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image must be under 5MB')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl, file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-32 h-32 rounded-full cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        whileTap={{ scale: 0.96 }}
      >
        {/* Base avatar - image or initials */}
        {avatarPreviewUrl ? (
          <img src={avatarPreviewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-purple-900/30 
                          flex items-center justify-center">
            <span className="text-3xl font-bold text-purple-300 font-display">{initials}</span>
          </div>
        )}

        {/* Hover/drag overlay */}
        <AnimatePresence>
          {(isHovering || isDragging) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-1
                         ${isDragging ? 'bg-purple-500/60' : 'bg-black/60'}`}
            >
              <Camera size={22} className="text-white" />
              <span className="text-[11px] text-white font-medium">
                {isDragging ? 'Drop it here' : 'Change photo'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ring accent - purely decorative, matches brand */}
        <div className="absolute inset-0 rounded-full ring-2 ring-purple-500/30 pointer-events-none" />
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <p className="text-xs text-text-muted mt-3">Click or drag a new photo</p>
    </div>
  )
}
