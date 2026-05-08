import { z } from "zod";

export const signInInputSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer."),
});

export const signUpInputSchema = signInInputSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Name must be 80 characters or fewer."),
});

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
