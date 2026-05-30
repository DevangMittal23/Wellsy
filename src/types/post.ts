import type { Profile } from "./user";

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  post_type: "text" | "image" | "video";
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  post_media?: PostMedia[];
  has_liked?: boolean;
  has_saved?: boolean;
}

export interface PostMedia {
  id: string;
  post_id: string;
  url: string;
  media_type: "image" | "video";
  width: number | null;
  height: number | null;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  replies?: Comment[];
}

export interface CreatePostData {
  content: string;
  post_type: "text" | "image" | "video";
  media_urls?: string[];
  is_draft?: boolean;
}
