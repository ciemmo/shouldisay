import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { UserProfile } from "./types";

const userProfileSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  subscription: {
    select: {
      status: true,
      currentPeriodEnd: true,
    },
  },
  usage: {
    select: {
      analysesThisMonth: true,
      charsThisMonth: true,
    },
  },
} satisfies Prisma.UserSelect;

export async function getUserById(
  id: string
): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { id },
    select: userProfileSelect,
  });
}

export async function getUserByEmail(
  email: string
): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { email },
    select: userProfileSelect,
  });
}

export type CreateUserInput = Pick<
  Prisma.UserCreateInput,
  "email" | "name" | "image" | "passwordHash" | "emailVerified"
>;

export async function createUser(
  data: CreateUserInput
): Promise<UserProfile> {
  return prisma.user.create({
    data: {
      ...data,
      subscription: { create: {} },
      usage: { create: {} },
    },
    select: userProfileSelect,
  });
}

export type UpdateUserInput = Pick<
  Prisma.UserUpdateInput,
  "email" | "name" | "image" | "emailVerified"
>;

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<UserProfile> {
  return prisma.user.update({
    where: { id },
    data,
    select: userProfileSelect,
  });
}

export async function getUserSubscription(
  userId: string
): Promise<UserProfile["subscription"]> {
  return prisma.subscription.findUnique({
    where: { userId },
    select: {
      status: true,
      currentPeriodEnd: true,
    },
  });
}

export async function getUserUsage(
  userId: string
): Promise<UserProfile["usage"]> {
  return prisma.usageStats.findUnique({
    where: { userId },
    select: {
      analysesThisMonth: true,
      charsThisMonth: true,
    },
  });
}
