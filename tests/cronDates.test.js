import { describe, it, expect } from 'vitest'
import { todayInBahia, bahiaClock, addDaysIso, brDateLabel, timeHasPassed } from '../src/lib/cronDates'

describe('cronDates', () => {
  it('compute o dia do estúdio no fuso da Bahia', () => {
    // 02:00 UTC = 23:00 do dia anterior em America/Bahia (UTC-3)
    expect(todayInBahia(new Date('2026-10-23T02:00:00Z'))).toBe('2026-10-22')
    expect(todayInBahia(new Date('2026-10-23T12:00:00Z'))).toBe('2026-10-23')
  })

  it('calcula a hora do estúdio no fuso da Bahia', () => {
    expect(bahiaClock(new Date('2026-10-23T10:00:00Z'))).toBe('07:00')
    expect(bahiaClock(new Date('2026-10-23T12:00:00Z'))).toBe('09:00')
  })

  it('soma dias pelo calendário, virando o mês', () => {
    expect(addDaysIso('2026-10-23', 7)).toBe('2026-10-30')
    expect(addDaysIso('2026-10-28', 7)).toBe('2026-11-04')
  })

  it('formata datas em DD/MM/AAAA e ignora valores inválidos', () => {
    expect(brDateLabel('2026-11-05')).toBe('05/11/2026')
    expect(brDateLabel('')).toBe('')
  })

  it('considera a aula passada quando o horário já chegou', () => {
    expect(timeHasPassed('08:00', '07:45')).toBe(false)
    expect(timeHasPassed('08:00', '08:00')).toBe(true)
    expect(timeHasPassed('08:00', '09:30')).toBe(true)
    // horário inválido é tratado como passado para nunca enviar após a aula
    expect(timeHasPassed('', '08:00')).toBe(true)
  })
})
