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
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Please enter a valid phone number"),
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

// Invitation schemas
export const invitationRecipientSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Please enter a valid phone number in E.164 format (e.g., +1234567890)"
    )
    .optional()
    .or(z.literal("")),
});

export const createInvitationSchema = z
  .object({
    memorialId: z.string().min(1, "Please select a memorial"),
    role: z.enum(["OWNER", "ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"], {
      message: "Please select a valid role",
    }),
    customSubject: z
      .string()
      .max(200, "Subject must be less than 200 characters")
      .optional()
      .or(z.literal("")),
    message: z
      .string()
      .max(1000, "Message must be less than 1000 characters")
      .optional()
      .or(z.literal("")),
    invitationCard: z.string().url("Invalid image URL").optional().or(z.literal("")),
    recipients: z
      .array(invitationRecipientSchema)
      .min(1, "At least one recipient is required")
      .refine(
        (recipients) => {
          // Each recipient must have at least email or phone (not empty string)
          return recipients.every(
            (r) => (r.email && r.email.trim()) || (r.phone && r.phone.trim())
          );
        },
        {
          message: "Each recipient must have at least an email or phone number",
        }
      ),
    sendViaEmail: z.boolean().default(true),
    sendViaWhatsApp: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If sendViaEmail is true, at least one recipient must have email
      if (data.sendViaEmail) {
        return data.recipients.some((r) => r.email && r.email.trim() !== "");
      }
      return true;
    },
    {
      message: "At least one recipient must have an email address when sending via email",
      path: ["recipients"],
    }
  )
  .refine(
    (data) => {
      // If sendViaWhatsApp is true, at least one recipient must have phone
      if (data.sendViaWhatsApp) {
        return data.recipients.some((r) => r.phone && r.phone.trim() !== "");
      }
      return true;
    },
    {
      message: "At least one recipient must have a phone number when sending via WhatsApp",
      path: ["recipients"],
    }
  )
  .refine(
    (data) => {
      // At least one delivery method must be selected
      return data.sendViaEmail || data.sendViaWhatsApp;
    },
    {
      message: "Please select at least one delivery method (Email or WhatsApp)",
      path: ["sendViaEmail"],
    }
  );

// File validation for invitation card
export const invitationCardFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(file.type),
      "Only JPG, PNG, GIF, and WebP images are allowed"
    ),
});

// Single invitation (for sending to one recipient at a time)
export const singleInvitationSchema = z
  .object({
    memorialId: z.string().min(1, "Please select a memorial"),
    role: z.enum(["OWNER", "ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"], {
      message: "Please select a valid role",
    }),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .optional()
      .or(z.literal("")),
    email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
    phone: z
      .string()
      .regex(
        /^\+?[1-9]\d{1,14}$/,
        "Please enter a valid phone number in E.164 format (e.g., +1234567890)"
      )
      .optional()
      .or(z.literal("")),
    customSubject: z
      .string()
      .max(200, "Subject must be less than 200 characters")
      .optional()
      .or(z.literal("")),
    message: z
      .string()
      .max(1000, "Message must be less than 1000 characters")
      .optional()
      .or(z.literal("")),
    invitationCard: z.string().url("Invalid image URL").optional().or(z.literal("")),
    sendViaEmail: z.boolean().default(true),
    sendViaWhatsApp: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Must have at least email or phone
      return (data.email && data.email.trim() !== "") || (data.phone && data.phone.trim() !== "");
    },
    {
      message: "Please provide at least an email address or phone number",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      // If sendViaEmail is true, must have email
      if (data.sendViaEmail && (!data.email || data.email.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Email address is required when sending via email",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      // If sendViaWhatsApp is true, must have phone
      if (data.sendViaWhatsApp && (!data.phone || data.phone.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Phone number is required when sending via WhatsApp",
      path: ["phone"],
    }
  )
  .refine(
    (data) => {
      // At least one delivery method must be selected
      return data.sendViaEmail || data.sendViaWhatsApp;
    },
    {
      message: "Please select at least one delivery method (Email or WhatsApp)",
      path: ["sendViaEmail"],
    }
  );

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type TributeInput = z.infer<typeof tributeSchema>;
export type InvitationRecipient = z.infer<typeof invitationRecipientSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type SingleInvitationInput = z.infer<typeof singleInvitationSchema>;
export type InvitationCardFile = z.infer<typeof invitationCardFileSchema>;
