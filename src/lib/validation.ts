// src/lib/validation.ts
// Shared validation schemas - TODO: implement

import { z } from "zod";

export const commonSchemas = {
  email: z.string().email(),
  password: z.string().min(8),
};