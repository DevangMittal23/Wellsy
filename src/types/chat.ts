import type { Profile } from "./user";

export interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_by: string | null;
  last_message_at: string;
  created_at: string;
  // Joined fields
  other_user?: Profile;
  last_message?: Message;
  unread_count?: number;
  room_members?: RoomMember[];
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: "admin" | "member";
  last_read_at: string;
  is_muted: boolean;
  joined_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "file" | "audio" | "system";
  media_url: string | null;
  reply_to: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  reactions: Record<string, string[]>;
  created_at: string;
  updated_at: string;
  // Joined — partial profile for display purposes
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}
