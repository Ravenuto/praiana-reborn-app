# Fundo branco nos cards de planos (Opção C)

Deixar os cards da página de Planos com fundo branco puro e sombra mais elevada, para destacarem do fundo areia. O selo "Mais popular" continua exatamente como está: mesmo fundo dos outros cards, borda laranja e a etiqueta em cima.

## O que muda

- Fundo do card: branco sólido (sem transparência/blur atual que deixava apagado).
- Borda: fininha e clara em todos os cards.
- Sombra: mais elevada e suave, dando profundidade sobre o fundo areia.
- Card "Mais popular": mesmo fundo branco, apenas com a borda laranja e a etiqueta no topo (inalterado).
- Modo escuro: mantém o card escuro do tema, só ajustando a mesma sombra/borda para ficar coerente.

## Onde

- `src/pages/Plans.jsx` — classes do `<article>` de cada plano.
- `src/components/admin/ManagePlansAdmin.jsx` — mesma aparência na prévia dos cards do admin.

## Detalhes técnicos

Trocar `bg-card/85 backdrop-blur-xl ring-1 ring-primary/10` por fundo sólido `bg-card`, borda `border-border/60` (laranja `border-accent` no destaque) e sombra em duas camadas (`0 24px 50px -22px` + halo curto), preservando o hover de elevação e a animação de entrada.
