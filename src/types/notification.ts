export type NotificationType =
  | "like"
  | "comment"
  | "friend_request"
  | "friend_accept"
  | "message"
  | "mention"
  | "follow";

export type NotificationEntityType =
  | "post"
  | "comment"
  | "message"
  | "friend_request";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  // Joined — partial profile for display purposes
  actor?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_online: boolean;
  };
}
