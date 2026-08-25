# Números em Lora itálico leve (app inteiro)

Todos os números do app (créditos, datas, horários, valores, contadores, estatísticas) passam a aparecer em **Lora itálico, peso leve**, sem precisar mexer em cada componente.

## Como funciona

Em vez de editar dezenas de telas uma a uma, o app passa a usar um truque de tipografia: a fonte Lora é aplicada apenas aos caracteres 0–9. Todo o resto do texto continua exatamente como está hoje (Cormorant nos títulos, Inter no corpo).

Resultado: qualquer número que já existe ou que for criado no futuro sai automaticamente em Lora itálico leve.

## O que muda

1. Carregar a Lora (itálico, peso 300) junto das outras fontes do site.
2. Criar uma família de fonte interna que usa Lora itálico 300 restrita aos dígitos.
3. Colocar essa família na frente das pilhas de fonte de títulos e de corpo, para valer em toda a interface.
4. Conferir visualmente as telas com mais números: Agenda, Área da aluna (créditos e validade), Histórico de pagamentos, Planos e painel Admin.

## Detalhes técnicos

- `src/routes/__root.tsx`: adicionar `Lora:ital,wght@1,300` ao link do Google Fonts.
- `src/styles.css`: adicionar um `@font-face` com `font-family: 'AppNumerals'`, `src: local/url da Lora italic 300` e `unicode-range: U+0030-0039, U+002C, U+002E` (dígitos, vírgula e ponto decimal); depois prefixar `'AppNumerals'` em `--font-heading-value` e `--font-body-value`.
- Sem alteração em lógica, dados ou componentes.
