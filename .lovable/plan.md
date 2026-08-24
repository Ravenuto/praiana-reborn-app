# Duração dos planos (mensal, trimestral, semestral...) e validade editável por aluna

## O que muda

### 1. Cadastro/edição de plano (Admin > Planos)
No formulário de plano, além de nome, preço, créditos e benefícios, entra um campo **Duração**:
- Opções rápidas: Mensal (30 dias), Trimestral (90), Semestral (180), Anual (365) e Personalizado (digitar dias).
- O card do plano na lista do admin passa a mostrar a duração ("Trimestral · 90 dias").
- Na página pública de Planos, a duração aparece junto do preço (ex.: "R$ 480 · trimestral"), e o cálculo de "por aula" continua igual.

### 2. Validade do plano por aluna (Admin > Cadastros)
- Ao atribuir um plano a uma aluna, a data de início continua sendo hoje e a **data de validade é calculada automaticamente** pela duração do plano.
- No diálogo de edição da aluna passam a existir dois campos editáveis: **Início do plano** e **Válido até** — a admin pode esticar ou encurtar manualmente quando quiser.
- Existe um atalho "+30 dias / +90 dias" para prorrogar rápido.
- A lista de alunas mostra "Válido até dd/mm/aaaa" e destaca em vermelho quando já venceu.

### 3. Perfil da aluna
- O texto fixo "Válido por 30 dias" é substituído pela validade real do plano dela ("Válido até 12/11/2026" e "faltam X dias").

## Detalhes técnicos
- Novo campo `duration_days` em `StudioPlan` (default 30) usado em `ManagePlansAdmin.jsx` e exibido em `src/pages/Plans.jsx`.
- Novo campo `plan_end_date` no usuário, gravado em `ManageStudents.jsx` no momento de atribuir plano (`plan_start_date + duration_days`) e editável no diálogo de edição.
- Datas formatadas com os helpers seguros de `src/lib/dates.js`.
- Nenhuma mudança na lógica de créditos nem no bloqueio por plano inativo nesta etapa (o campo fica pronto para isso).
