// src/features/billing/plans.ts
// Plan definitions - TODO: implement

import { Plan, PlanLimits } from "./types";

export const PLANS: Plan[] = [];
export function getPlanById() { return undefined; }
export function getPlanByPriceId() { return undefined; }
export function getDefaultPlan() { return PLANS[0]; }
export function formatPrice() { return "Free"; }
export function canAccessFeature() { return false; }
export function getUsagePercentage() { return 0; }
export function isOverLimit() { return false; }