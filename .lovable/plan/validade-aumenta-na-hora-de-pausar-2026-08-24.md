# Validade aumenta na hora de pausar

Hoje, ao pausar com uma previsão de retorno, a data "Válido até" continua igual — ela só muda quando o plano é retomado. E, mesmo na retomada, a nova data é gravada num lugar que a lista e o cadastro não leem, então na prática você nunca vê a validade mudar.

## Como vai funcionar

- **Ao pausar com previsão de retorno**: o sistema já soma na hora os dias entre o início da pausa e a data de retorno na validade. Mensagem: "Plano pausado. +X dias na validade (até dd/mm)."
- **Ao pausar sem previsão**: nada muda na validade ainda; os dias são somados quando você retomar (como hoje).
- **Ao retomar antes/depois da data prevista**: o sistema ajusta a diferença — se ela voltou antes, tira os dias sobrando; se voltou depois, soma os dias extras. Nunca conta duas vezes.
- **Retorno automático na data prevista**: continua funcionando, sem somar de novo (os dias já foram somados na pausa).
- A nova validade aparece imediatamente na lista de cadastros e no cadastro da aluna.

## Detalhes técnicos

Em `src/components/admin/ManageStudents.jsx`:

- `doPause`: quando `untilISO` existe, calcular `expected = diffDias(startISO, untilISO)` e gravar `plan_end_date = addDaysISO(endAtual, expected)` mais `plan_pause_credited_days = expected`.
- `doResume`: calcular `real = pausedDays(startISO)` e aplicar apenas o delta `real - (plan_pause_credited_days || 0)` (pode ser negativo), zerando o campo de crédito.
- Correção de leitura/escrita: gravar `plan_end_date` (e os campos de pausa) tanto no nível superior do usuário quanto em `data`, já que a lista, o dialog de edição e o perfil leem `student.plan_end_date` no nível superior. É essa divergência que faz a validade parecer não mudar.
- Nova helper em `src/lib/planPause.js`: `daysBetweenISO(a, b)` para o cálculo previsto.
