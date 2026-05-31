export interface Profile {
  id: string;
  username: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  skills: string[];
  interests: string[];
  social_links: Record<string, string>;
  digital_core: {
    shape: "sphere" | "crystal" | "orb" | "cube";
    color: string;
    glow: number;
    rotation: number;
  };
  followers_count: number;
  following_count: number;
  friends_count: number;
  posts_count: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  display_name: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  interests?: string[];
  social_links?: Record<string, string>;
}
