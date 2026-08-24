# Pausar plano sem mensagens estranhas

Tirar as caixinhas de texto do navegador (aquelas com ID/data digitada) e deixar a pausa em um clique, com data de retorno opcional.

## Como vai funcionar

- **Pausar**: você clica no botão de pausa da aluna e abre um cartão simples com:
  - a data de início já preenchida com hoje (editável no seletor de data);
  - um campo opcional **Previsão de retorno** (pode deixar em branco = sem data definida);
  - botão **Pausar plano**.
- **Retomar**: um clique no botão de play. Sem perguntas. O sistema conta os dias parados (do início da pausa até hoje) e soma automaticamente na data "Válido até".
- **Retorno automático**: se você definir a previsão de retorno e essa data chegar, o plano volta sozinho ao abrir a tela de cadastros, já somando os dias pausados na validade.
- Mensagem final curta: "Plano retomado. +X dias na validade."

## O que continua igual

- Selo "Pausado" na lista, com os dias acumulados.
- Reservas futuras canceladas ao pausar, liberando vaga para a fila de espera.
- Aviso de plano pausado no perfil e bloqueio de reserva na agenda.

## Detalhes técnicos

- Remover `window.prompt` de `handleTogglePause` em `src/components/admin/ManageStudents.jsx`.
- Novo dialog local de pausa (usa `Dialog` já importado) com estado `pauseTarget`, `pauseStart`, `pauseUntil`.
- Novo campo `plan_pause_until` no `data` da aluna; retomada usa `pausedDays()` + `addDaysISO()` de `src/lib/planDuration.js`.
- Auto-retorno: efeito na montagem de `ManageStudents` que percorre alunas com `plan_paused` e `plan_pause_until <= hoje` e chama a mesma função de retomada.
