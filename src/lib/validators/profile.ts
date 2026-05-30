import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  bio: z.string().max(300, "Bio must be less than 300 characters").optional(),
  location: z.string().max(100).optional(),
  website: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  skills: z.array(z.string().max(30)).max(10, "Maximum 10 skills").optional(),
  interests: z.array(z.string().max(30)).max(10, "Maximum 10 interests").optional(),
  social_links: z
    .record(z.string(), z.string().url().or(z.literal("")))
    .optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
