import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(2000, "Post must be less than 2000 characters"),
  post_type: z.enum(["text", "image", "video"]).default("text"),
  is_draft: z.boolean().default(false),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters"),
  parent_id: z.string().uuid().optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
