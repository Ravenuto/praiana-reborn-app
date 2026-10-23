import type { ComponentType } from 'react'
import { template as waitlistPromotedTemplate } from './waitlist-promoted'
import { template as planRenewedTemplate } from './plan-renewed'
import { template as waitlistEnteredTemplate } from './waitlist-entered'
import { template as waitlistClosedTemplate } from './waitlist-closed'
import { template as classCancelledTemplate } from './class-cancelled'
import { template as classReminderTemplate } from './class-reminder'
import { template as planExpiringTemplate } from './plan-expiring'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'waitlist-promoted': waitlistPromotedTemplate,
  'plan-renewed': planRenewedTemplate,
  'waitlist-entered': waitlistEnteredTemplate,
  'waitlist-closed': waitlistClosedTemplate,
  'class-cancelled': classCancelledTemplate,
  'class-reminder': classReminderTemplate,
  'plan-expiring': planExpiringTemplate,
}
