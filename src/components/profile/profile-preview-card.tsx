'use client'

import { motion } from 'framer-motion'
import { useEditProfile } from './edit-profile-context'
import { PulseRing } from '@/components/shared/pulse-ring'
import { SignalBadge } from '@/components/shared/signal-badge'
import { getInitials } from '@/lib/utils'

export function ProfilePreviewCard({ userId, avatarBaseUrl }: { userId: string; avatarBaseUrl: string | null }) {
  const { displayName, username, bio, avatarPreviewUrl, selectedPulse } = useEditProfile()

  const initials = getInitials(displayName || "User")
  const displayAvatarUrl = avatarPreviewUrl || avatarBaseUrl

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-xl backdrop-blur-md">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-6 text-center font-semibold">
        How your Circle sees you
      </p>

      <div className="flex flex-col items-center text-center">
        <PulseRing pulseType={selectedPulse} size={88}>
          <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br 
                          from-purple-600/30 to-purple-900/30 flex items-center justify-center ring-2 ring-border/20">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-purple-300 font-display">{initials}</span>
            )}
          </div>
        </PulseRing>

        <motion.h3 
          key={displayName}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-lg font-bold font-display text-text-primary truncate max-w-full"
        >
          {displayName || 'Your Name'}
        </motion.h3>
        <p className="text-xs text-text-muted">@{username || 'username'}</p>

        {bio ? (
          <p className="text-sm text-text-secondary mt-4 leading-relaxed max-w-[280px] break-words whitespace-pre-wrap">
            {bio}
          </p>
        ) : (
          <p className="text-xs text-text-muted/40 italic mt-4">
            No bio written yet...
          </p>
        )}

        <div className="mt-6 flex justify-center w-full">
          <SignalBadge userId={userId} variant="full" />
        </div>
      </div>
    </div>
  )
}
