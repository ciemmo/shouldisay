// src/features/billing/types.ts
// Billing feature types - TODO: implement

import { SubscriptionStatus } from "@prisma/client";

export interface Plan { id: string; name: string; description: string; price: number; priceId: string; interval: "month" | "year"; features: PlanFeature[]; limits: PlanLimits; }
export interface PlanFeature { key: string; label: string; included: boolean; }
export interface PlanLimits { maxCharsPerRequest: number; maxRequestsPerMonth: number | null; conversationContext: boolean; detailedSuggestions: boolean; rephrasingAssistance: boolean; historyRetentionDays: number; apiAccess: boolean; }
export interface SubscriptionData { id: string; status: SubscriptionStatus; currentPeriodEnd: Date | null; cancelAtPeriodEnd: boolean; plan: Plan; }
export interface UsageData { analysesThisMonth: number; charsThisMonth: number; lastResetDate: Date; planLimits: PlanLimits; }
export interface CheckoutSessionData { sessionId: string; url: string; }
export interface BillingPortalData { url: string; }
export interface WebhookEvent { type: string; data: { object: Record<string, unknown>; }; }