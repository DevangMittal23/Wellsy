import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string into a human-readable relative time */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Format a date for message timestamps */
export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return "Yesterday " + format(date, "h:mm a");
  }
  return format(date, "MMM d, h:mm a");
}

/** Format a date for conversation list previews */
export function formatConversationTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "MMM d");
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/** Generate initials from a display name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Get Supabase storage public URL */
export function getStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
