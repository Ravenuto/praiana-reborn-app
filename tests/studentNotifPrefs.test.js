import { describe, it, expect } from 'vitest';
import { notificationChannels, isDeliverableStudent } from '../src/lib/studentNotifPrefs.ts';
describe('student delivery preferences', () => {
  it('defaults to both channels', () => expect(notificationChannels(undefined)).toEqual({ email: true, app: true }));
  it('email only disables app notices', () => expect(notificationChannels('email')).toEqual({ email: true, app: false }));
  it('app only disables emails', () => expect(notificationChannels('app')).toEqual({ email: false, app: true }));
  it('both enables both channels', () => expect(notificationChannels('both')).toEqual({ email: true, app: true }));
  it('never sends to synthetic guest identities', () => expect(isDeliverableStudent('guest@participante.invalid', null)).toBe(false));
});