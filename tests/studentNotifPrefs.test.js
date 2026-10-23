import { describe, it, expect } from 'vitest';
import { notificationChannels, isDeliverableStudent, isCancelledOccurrence } from '../src/lib/studentNotifPrefs.ts';
describe('student delivery preferences', () => {
  it('defaults to both channels', () => expect(notificationChannels(undefined)).toEqual({ email: true, app: true }));
  it('email only disables app notices', () => expect(notificationChannels('email')).toEqual({ email: true, app: false }));
  it('app only disables emails', () => expect(notificationChannels('app')).toEqual({ email: false, app: true }));
  it('both enables both channels', () => expect(notificationChannels('both')).toEqual({ email: true, app: true }));
  it('never sends to synthetic guest identities', () => expect(isDeliverableStudent('guest@participante.invalid', null)).toBe(false));
  it('cancels from November 3 forward without touching October 27', () => {
    expect(isCancelledOccurrence('2026-10-27', '2026-11-03', false, 'confirmada')).toBe(false);
    expect(isCancelledOccurrence('2026-11-03', '2026-11-03', false, 'confirmada')).toBe(true);
    expect(isCancelledOccurrence('2026-11-10', '2026-11-03', false, 'confirmada')).toBe(true);
  });
  it('single-day cancellation leaves later bookings intact', () => expect(isCancelledOccurrence('2026-11-10', '2026-11-03', true, 'confirmada')).toBe(false));
});