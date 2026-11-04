// src/app/api/auth/[...nextauth]/route.ts
// NextAuth API route handler

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;