-- Better Auth core tables (user, session, account, verification)
-- These are managed by Better Auth, not Drizzle. Created via this migration.
-- Reference: https://www.better-auth.com/docs/concepts/database#core-schema

CREATE TABLE IF NOT EXISTS `user` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `email` TEXT NOT NULL UNIQUE,
  `emailVerified` INTEGER NOT NULL DEFAULT 0,
  `image` TEXT,
  `createdAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updatedAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS `session` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `expiresAt` TEXT NOT NULL,
  `ipAddress` TEXT,
  `userAgent` TEXT,
  `userId` TEXT NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `token` TEXT NOT NULL UNIQUE,
  `createdAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updatedAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS `account` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `accountId` TEXT NOT NULL,
  `providerId` TEXT NOT NULL,
  `userId` TEXT NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `accessToken` TEXT,
  `refreshToken` TEXT,
  `idToken` TEXT,
  `expiresAt` TEXT,
  `password` TEXT,
  `createdAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updatedAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS `verification` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `identifier` TEXT NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` TEXT NOT NULL,
  `createdAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updatedAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Better Auth Stripe plugin table
CREATE TABLE IF NOT EXISTS `subscription` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `plan` TEXT NOT NULL,
  `referenceId` TEXT NOT NULL,
  `stripeCustomerId` TEXT,
  `stripeSubscriptionId` TEXT,
  `status` TEXT,
  `periodStart` TEXT,
  `periodEnd` TEXT,
  `cancelAtPeriodEnd` INTEGER DEFAULT 0,
  `seats` INTEGER,
  `createdAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updatedAt` TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Add better_auth_user_id column to existing members table
ALTER TABLE `members` ADD COLUMN `better_auth_user_id` TEXT UNIQUE;

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS `idx_session_userId` ON `session`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_session_token` ON `session`(`token`);

-- Index for account lookups
CREATE INDEX IF NOT EXISTS `idx_account_userId` ON `account`(`userId`);
