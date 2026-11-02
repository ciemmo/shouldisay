// src/features/auth/utils.ts
// Auth utilities - TODO: implement

import { z } from "zod";

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);
export const registerSchema = z.object({ email: emailSchema, password: passwordSchema, name: z.string().optional() });
export const loginSchema = z.object({ email: emailSchema, password: z.string() });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function validateRegisterInput() { return registerSchema.safeParse({}); }
export function validateLoginInput() { return loginSchema.safeParse({}); }
export function getPasswordStrength() { return { score: 0, label: "Weak", color: "danger" }; }