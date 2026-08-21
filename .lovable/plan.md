# Corrigir erro na página Agenda

A aba Agenda quebra e mostra a tela de erro. O console aponta para o cálculo do período do plano em `src/pages/Schedule.jsx`: a data de início do plano da aluna vem em um formato inesperado (ou vazia/inválida), então `new Date(...)` gera uma data inválida e o `format()` do date-fns lança "Invalid time value", derrubando a página inteira.

## O que fazer

1. Criar uma leitura segura da data de início do plano em `Schedule.jsx`:
   - aceitar tanto `YYYY-MM-DD` quanto data ISO completa (com hora);
   - se a data for inválida ou ausente, tratar como "sem restrição de período" (min/max nulos) em vez de quebrar.
2. Proteger todos os outros `format()` da página que dependem de datas vindas de dados (ex.: a data em `dd/MM/yyyy` usada nas notificações) com a mesma checagem de validade.
3. Extrair essa checagem para um helper reutilizável (`parseDateSafe`) e usá-lo também onde a mesma conversão `data + "T12:00:00"` aparece, evitando o mesmo crash em outras telas.
4. Verificar no preview que a Agenda carrega normalmente, com e sem plano cadastrado, e que o console fica sem o erro `RangeError: Invalid time value`.

## Detalhes técnicos

- Arquivo principal: `src/pages/Schedule.jsx` (memo `planDates`, linhas ~59-67, e o `format(new Date(selectedDate + "T12:00:00"))`).
- Helper: função utilitária que retorna `null` quando `isNaN(date.getTime())`; nenhum `format()` é chamado com `null`.
- Sem mudança de dados nem de banco — apenas tratamento defensivo no front-end.
