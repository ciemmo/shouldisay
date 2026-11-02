// src/lib/utils.ts
// Utility functions - TODO: implement

export function cn(...inputs: unknown[]): string {
  return inputs.filter(Boolean).join(" ");
}