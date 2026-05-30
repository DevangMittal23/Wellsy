import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20)
    .concat(Math.random().toString(36).slice(2, 6));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g);
  return matches ? [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))] : [];
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w]+/g);
  return matches ? [...new Set(matches.map((m) => m.slice(1).toLowerCase()))] : [];
}
