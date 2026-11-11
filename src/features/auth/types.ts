// src/features/auth/types.ts
// Auth feature types - TODO: implement

import { SubscriptionStatus } from "@prisma/client";

export interface AuthUser { id: string; email: string; name?: string | null; image?: string | null; }
export interface SessionUser extends AuthUser { subscriptionStatus: SubscriptionStatus; }
export type { LoginInput, RegisterInput } from "./utils";
export interface AuthError { code: string; message: string; }
export interface AuthResponse<T = AuthUser> { success: boolean; data?: T; error?: AuthError; }