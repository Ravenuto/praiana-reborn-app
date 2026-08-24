## Remover botões rápidos +30 / +90 dias no cadastro da aluna

### Contexto
No diálogo de edição de uma aluna (em `Cadastros > Admin`), o campo **Válido até** exibe hoje três ações auxiliares:
- `+30 dias`
- `+90 dias`
- `Recalcular pelo plano`

A usuária pediu para retirar as opções de incremento rápido e deixar apenas a alteração manual da data, com a opção de recalcular pelo plano ainda disponível.

### O que será alterado
- Em `src/components/admin/ManageStudents.jsx`, no diálogo de edição (`editDialog`):
  - Remover os botões `+30 dias` e `+90 dias`.
  - Manter o campo `input type="date"` de **Válido até** como está, permitindo editar a data manualmente.
  - Manter o botão **Recalcular pelo plano**, que reseta a data de término com base na duração do plano selecionado.

### Não será alterado
- A regra de cálculo automático ao trocar o plano ou a data de início continua funcionando.
- O campo de data manual já existe; não precisa de novo campo ou nova lib.
- A criação manual de aluna não tem botões rápidos, então não há alteração lá.
