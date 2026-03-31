

# Migrate All Emails from Resend to Lovable Cloud

## Summary

You have **16 Edge Functions** currently using Resend's SDK to send emails. The email domain `notify.pulseos.tech` is already set up on Lovable Cloud (DNS verifying). This plan migrates everything to Lovable Cloud's built-in email system and updates all templates to match your current brand colors.

## Current Brand Colors (from your CSS)

- **Primary**: HSL(4, 78%, 58%) = `#E04F3E` (warm red/coral)
- **Accent**: HSL(35, 92%, 52%) = `#F0A020` (amber/orange)
- **Current emails use**: purple `#8b5cf6` / `#6d28d9` (outdated)

All emails will be updated to use the coral red primary with amber accents, white backgrounds, and proper contrast for accessibility.

---

## Step 1: Set Up Auth Email Templates

Use the built-in auth email scaffolding to recreate the `auth-email-hook` function. This replaces the current Resend-based hook with the queue-based system. Then apply brand colors (coral red headers, amber accents) to all 6 auth templates (signup, recovery, magic link, email change, invite, reauthentication). Deploy the updated function.

## Step 2: Scaffold Transactional Email Infrastructure

Set up the transactional email system (Edge Functions: `send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`). Create an unsubscribe page at `/unsubscribe`.

## Step 3: Create Transactional Email Templates

Create React Email templates for each email type, all branded with coral red/amber:

| Template | Replaces Edge Function |
|---|---|
| `contact-form-notification` | `contact-form` (to support) |
| `contact-form-confirmation` | `contact-form` (to user) |
| `welcome` | `send-welcome-email` |
| `friend-request` | `send-friend-request-email` |
| `app-invite` | `send-invite-email` |
| `invite-accepted` | `send-invite-accepted-email` |
| `notification` | `send-notification-email` |
| `task-invite` | `send-task-invite-email` |
| `activity-invite` | `send-activity-invite-email` |
| `daily-digest` | `send-daily-digest` |
| `task-reminder` | `task-reminders` |
| `overdue-task-reminder` | `overdue-task-reminder` |
| `leaderboard-reminder` | `leaderboard-reminder` |
| `inactive-reminder` | `inactive-user-reminder` |
| `verified-thank-you` | `send-verified-thank-you` |
| `password-reset` | `request-password-reset` |

Register all in the `registry.ts` TEMPLATES map.

## Step 4: Rewrite Each Edge Function

Replace `Resend` imports and `resend.emails.send(...)` calls with `supabase.functions.invoke('send-transactional-email', ...)` using the email queue. Each function keeps its existing logic (fetching profiles, checking preferences, validation) but sends via the queue instead of Resend directly. Include proper `idempotencyKey` for each send.

For client-triggered emails (contact form, welcome, etc.), also update the frontend call sites to invoke `send-transactional-email` directly where appropriate.

## Step 5: Update All Links

Verify all CTA links use correct URLs:
- `https://pulseos.tech/app` for dashboard
- `https://pulseos.tech/app/friends` for friend-related actions
- `https://pulseos.tech/app/settings` for email preferences
- `https://pulseos.tech/auth` for signup invites

## Step 6: Brand Color Consistency

Every email template will use:
- **Header gradient**: `#E04F3E` to `#C43E30` (coral red)
- **CTA buttons**: `#E04F3E` to `#C43E30` gradient
- **Accent text/links**: `#E04F3E`
- **Body background**: `#ffffff` (white)
- **Outer background**: `#f1f5f9` (light gray)
- **Text**: `#1e293b` (headings), `#475569` (body), `#64748b` (footer)
- **High contrast throughout** for accessibility

## Step 7: Deploy All Functions

Deploy all modified Edge Functions in a single batch to ensure everything goes live together.

---

## Technical Details

- **16 Edge Functions** will be rewritten to remove all Resend SDK imports
- **16+ React Email templates** created in `supabase/functions/_shared/transactional-email-templates/`
- **1 unsubscribe page** created at `/unsubscribe`
- **auth-email-hook** re-scaffolded to use the queue pattern
- All emails route through the `process-email-queue` dispatcher (already set up)
- The `RESEND_API_KEY` secret becomes unused after migration

