// src/features/user/types.ts
// User feature types - TODO: implement

import { User, SubscriptionStatus } from "@/types/user";

export interface UserProfile extends User {
  subscription?: { status: SubscriptionStatus; currentPeriodEnd: Date | null } | null;
  usage?: { analysesThisMonth: number; charsThisMonth: number } | null;
}