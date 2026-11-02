// src/types/user.ts
// User-related types

import { SubscriptionStatus } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  subscriptionStatus: SubscriptionStatus;
}

export interface UserProfile extends User {
  subscription?: UserSubscription | null;
  usage?: UserUsage | null;
}

export interface UserSubscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string | null;
}

export interface UserUsage {
  id: string;
  analysesThisMonth: number;
  charsThisMonth: number;
  lastResetDate: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}