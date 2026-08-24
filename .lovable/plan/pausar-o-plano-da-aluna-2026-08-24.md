# Pausar o plano da aluna

Permitir que você congele temporariamente o plano de uma aluna (doença, viagem) e, ao liberar, a data de vencimento aumenta automaticamente pelos dias parados.

## Como funciona

- No cadastro da aluna (aba Cadastros do admin), cada aluna ganha um botão **Pausar plano** / **Retomar plano**.
- Ao pausar: você confirma e o app guarda a data de início da pausa. O plano continua "ativo", mas marcado como pausado.
- Ao retomar: o app conta quantos dias ficaram pausados e soma esses dias na data "Válido até". Você ainda pode ajustar manualmente a data depois, como já faz hoje.
- Também dá para informar manualmente a data em que a pausa começou, caso você registre depois.

## O que a aluna vê

- Ela continua entrando no app normalmente.
- Aparece um aviso de **Plano pausado** no perfil e na agenda.
- Os botões de reservar aula ficam bloqueados até você liberar.
- Ao pausar, as reservas futuras dela são canceladas automaticamente e as vagas liberadas seguem o fluxo normal da fila de espera.

## Onde aparece

- Lista de cadastros: selo "Pausado" ao lado do nome, com a data em que a pausa começou.
- Dialog de edição da aluna: bloco de pausa com botão pausar/retomar e o total de dias pausados.
- Perfil da aluna: aviso de plano pausado no lugar da contagem de dias restantes.

## Detalhes técnicos

- Novos campos no registro da aluna: `plan_paused` (bool), `plan_paused_at` (data), `plan_paused_days` (acumulado).
- Ao retomar: `plan_end_date = addDaysISO(plan_end_date, diasPausados)` usando os helpers existentes de `src/lib/planDuration.js`.
- Arquivos tocados: `src/components/admin/ManageStudents.jsx` (ações e UI), `src/pages/Schedule.jsx` e `src/components/schedule/SessionCard.jsx` (bloqueio de reserva), `src/pages/Profile.jsx` (aviso), `src/lib/waitlist.js` reutilizado no cancelamento em massa.
- `AppLayout` não muda: plano pausado continua contando como ativo para acesso.
