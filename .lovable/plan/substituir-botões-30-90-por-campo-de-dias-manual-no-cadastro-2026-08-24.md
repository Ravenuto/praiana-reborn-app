## Substituir botões +30 / +90 por campo de dias manual no cadastro da aluna

### Contexto
No diálogo de edição de uma aluna (em `Cadastros > Admin`), o campo **Válido até** exibe hoje três ações:
- `+30 dias`
- `+90 dias`
- `Recalcular pelo plano`

A usuária quer retirar os botões fixos de +30 e +90 dias e, no lugar, ter um campo onde ela mesma digita quantos dias deseja acrescentar (por exemplo, 10 dias) e confirma a adição.

### O que será alterado
- Em `src/components/admin/ManageStudents.jsx`, no diálogo de edição (`editDialog`):
  - Remover os botões `+30 dias` e `+90 dias`.
  - Adicionar um campo numérico curto (ex: `input type="number"`) para digitar a quantidade de dias a acrescentar.
  - Adicionar um botão ao lado do campo, com texto tipo **"Adicionar dias"** ou **"+"**, que soma a quantidade digitada à data atual do campo **Válido até**.
  - Manter o campo `input type="date"` de **Válido até** editável manualmente.
  - Manter o botão **Recalcular pelo plano**, que reseta a data de término com base na duração do plano selecionado.

### Comportamento esperado
- Se o campo de dias estiver vazio ou zerado, o botão fica desabilitado ou não faz nada.
- Se a data de término estiver vazia, usa a data de início do plano como base.
- Se ambas estiverem vazias, usa a data de hoje como base.
- O cálculo usa a função `addDaysISO` já existente no projeto.

### Não será alterado
- A regra de cálculo automático ao trocar o plano ou a data de início continua funcionando.
- A criação manual de aluna não tem botões rápidos, então não há alteração lá.
