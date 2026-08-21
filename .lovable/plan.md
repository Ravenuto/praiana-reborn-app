# Entrar como aluna deve permitir reservar aula

## O que está acontecendo

Sua conta tem os papéis de professora/admin além de aluna. Hoje o app decide esconder os botões de reserva olhando apenas para o papel da conta (`isTeacher`), e não para o modo escolhido na tela de login. Resultado: mesmo entrando como "aluna", a Agenda entra em modo somente leitura (sem banner de créditos e sem botão "Reservar"), e o Perfil mostra o selo "Professora" em vez do plano.

## Correção

- Na Agenda, usar o modo de login (aluna / professora / admin) para decidir a visão:
  - modo aluna: banner de créditos visível e botões de reservar/cancelar ativos;
  - modo professora: visão somente leitura, como está hoje.
- No Perfil, aplicar a mesma regra: no modo aluna mostra plano, créditos, datas e pagamentos; no modo professora mostra o selo "Professora".

## Detalhes técnicos

- Em `src/lib/roles.js`, expor um sinalizador derivado do modo (ex.: `viewAsStudent = mode === "aluna"`), mantendo `isTeacher`/`isAdmin` como estão para as abas de staff.
- Em `src/pages/Schedule.jsx`, trocar `isTeacher` por esse sinalizador nas linhas do `CreditBanner`, do `subtitle` e do `readOnly` passado ao `SessionCard`.
- Em `src/pages/Profile.jsx`, trocar as condições `!isTeacher` pelo mesmo sinalizador.
- Nenhuma mudança de banco ou de regras de negócio de crédito.
