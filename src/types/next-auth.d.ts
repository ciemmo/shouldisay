import type { SubscriptionStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionStatus: SubscriptionStatus;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    subscriptionStatus?: SubscriptionStatus;
    accessToken?: string;
    provider?: string;
  }
}
