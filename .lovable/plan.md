# Números voltam à fonte natural do app

Os números deixam de usar a fonte Lora e voltam a seguir a fonte do texto onde estão: Inter no corpo do app e Cormorant nos títulos. É a opção que mais se encaixa, já que o desencaixe vinha justamente de misturar uma serifada dentro de textos em Inter.

## O que muda

- Datas, horários, créditos, valores, contadores e estatísticas passam a usar a mesma fonte do texto ao redor.
- Nenhuma tela, dado ou funcionalidade é alterada — só a tipografia dos dígitos.

## Detalhes técnicos

- `src/styles.css`: remover os dois blocos `@font-face` da família `AppNumerals` e tirar `'AppNumerals'` do início de `--font-heading-value`, `--font-body-value` e `--font-script-value`.
- `src/routes/__root.tsx`: sem alteração (a Lora não é carregada por link).

Se depois quiser testar a "Lora em pé" (opção 2 da prévia), é só pedir — a troca é de uma linha.
