// src/types/index.ts — HUDdang unified type definitions
// Every type maps 1:1 to the database schema

export type User = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  online_at: string
  created_at: string
  updated_at: string
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
  requester?: User
  addressee?: User
}

export type ConversationType = 'dm' | 'group'

export type Conversation = {
  id: string
  type: ConversationType
  name: string | null
  avatar_url: string | null
  created_by: string
  last_message_at: string
  created_at: string
  participants?: Participant[]
  last_message?: Message | null
  unread_count?: number
}

export type ParticipantRole = 'member' | 'admin'

export type Participant = {
  id: string
  conversation_id: string
  user_id: string
  role: ParticipantRole
  last_read_message_id: string | null
  joined_at: string
  user?: User
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'gif' | 'file' | 'system'

export type MediaMetadata = {
  width?: number
  height?: number
  duration?: number
  size?: number
  filename?: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  type: MessageType
  media_url: string | null
  media_metadata: MediaMetadata | null
  gif_url: string | null
  reply_to_id: string | null
  is_edited: boolean
  is_deleted: boolean
  deleted_for: 'none' | 'me' | 'everyone'
  created_at: string
  updated_at: string
  sender?: User
  reply_to?: Message | null
  reactions?: MessageReaction[]
}

export type MessageReaction = {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: User
}

export type PostVisibility = 'public' | 'friends' | 'private'

export type LinkPreview = {
  title?: string
  description?: string
  image?: string
  domain?: string
}

export type Post = {
  id: string
  author_id: string
  content: string | null
  media_urls: string[]
  media_types: string[]
  link_url: string | null
  link_preview: LinkPreview | null
  visibility: PostVisibility
  likes_count: number
  comments_count: number
  reposts_count: number
  is_repost: boolean
  original_post_id: string | null
  created_at: string
  updated_at: string
  author?: User
  is_liked?: boolean
  is_bookmarked?: boolean
  original_post?: Post | null
}

export type Comment = {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  likes_count: number
  created_at: string
  updated_at: string
  author?: User
  replies?: Comment[]
  is_liked?: boolean
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'post_like'
  | 'post_comment'
  | 'comment_like'
  | 'comment_reply'
  | 'mention'
  | 'message'
  | 'group_invite'
  | 'call_missed'

export type Notification = {
  id: string
  recipient_id: string
  actor_id: string | null
  type: NotificationType
  entity_id: string | null
  entity_type: 'post' | 'message' | 'comment' | 'conversation' | 'user' | null
  body: string | null
  is_read: boolean
  created_at: string
  actor?: User
}

export type Story = {
  id: string
  author_id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  views_count: number
  expires_at: string
  created_at: string
  author?: User
  is_viewed?: boolean
}

export type CallType = 'voice' | 'video'
export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'rejected'

export type CallLog = {
  id: string
  room_name: string
  conversation_id: string | null
  initiated_by: string
  call_type: CallType
  status: CallStatus
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  created_at: string
  initiator?: User
}

// UI State types
export type ModalType =
  | 'create-post'
  | 'create-group'
  | 'group-info'
  | 'media-viewer'
  | 'gif-picker'
  | 'confirm-delete'
  | null

export type ActiveCall = {
  roomName: string
  conversationId: string
  callType: CallType
  participants: User[]
  token: string
}

export type IncomingCall = {
  roomName: string
  conversationId: string
  callType: CallType
  callerName: string
  callerAvatar: string | null
  token: string
}
