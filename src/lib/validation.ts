import { z } from "zod";

// Password validation schema with strong requirements
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// User registration schema
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z.string().email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// User login schema - accepts either email or phone number
export const loginSchema = z
  .object({
    identifier: z.string().min(1, "Email or phone number is required"),
    password: z.string().min(1, "Password is required"),
  })
  .refine(
    (data) => {
      // Check if identifier is either a valid email or phone number
      const isEmail = z.string().email().safeParse(data.identifier).success;
      const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(data.identifier); // Basic phone validation
      return isEmail || isPhone;
    },
    {
      message: "Please enter a valid email address or phone number",
      path: ["identifier"],
    }
  );

// Password reset schema
export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });

// Memorial creation schema
export const createMemorialSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid birth date"),
  deathDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid death date"),
  biography: z.string().max(5000, "Biography must be less than 5000 characters").optional(),
  epitaph: z.string().max(500, "Epitaph must be less than 500 characters").optional(),
});

// Comment schema
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

// Tribute schema
export const tributeSchema = z.object({
  title: z.string().max(200, "Title must be less than 200 characters").optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be less than 5000 characters"),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type TributeInput = z.infer<typeof tributeSchema>;
