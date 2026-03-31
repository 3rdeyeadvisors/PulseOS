/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcome } from './welcome.tsx'
import { template as contactFormConfirmation } from './contact-form-confirmation.tsx'
import { template as contactFormNotification } from './contact-form-notification.tsx'
import { template as friendRequest } from './friend-request.tsx'
import { template as appInvite } from './app-invite.tsx'
import { template as inviteAccepted } from './invite-accepted.tsx'
import { template as notification } from './notification.tsx'
import { template as taskInvite } from './task-invite.tsx'
import { template as activityInvite } from './activity-invite.tsx'
import { template as dailyDigest } from './daily-digest.tsx'
import { template as taskReminder } from './task-reminder.tsx'
import { template as overdueTaskReminder } from './overdue-task-reminder.tsx'
import { template as leaderboardReminder } from './leaderboard-reminder.tsx'
import { template as inactiveReminder } from './inactive-reminder.tsx'
import { template as verifiedThankYou } from './verified-thank-you.tsx'
import { template as passwordReset } from './password-reset.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'contact-form-confirmation': contactFormConfirmation,
  'contact-form-notification': contactFormNotification,
  'friend-request': friendRequest,
  'app-invite': appInvite,
  'invite-accepted': inviteAccepted,
  'notification': notification,
  'task-invite': taskInvite,
  'activity-invite': activityInvite,
  'daily-digest': dailyDigest,
  'task-reminder': taskReminder,
  'overdue-task-reminder': overdueTaskReminder,
  'leaderboard-reminder': leaderboardReminder,
  'inactive-reminder': inactiveReminder,
  'verified-thank-you': verifiedThankYou,
  'password-reset': passwordReset,
}
