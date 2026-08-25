# Cards de planos no modo escuro (Opção C)

No modo escuro os cards ficam quase da mesma cor do fundo. A Opção C deixa o card um tom mais claro que o fundo, com um brilho azul suave e borda azulada — o mesmo layout do modo claro, só ajustando fundo, borda e sombra.

## O que muda

- Fundo do card: leve degradê azul-escuro, um tom acima do fundo da página.
- Borda: azulada e discreta (em vez do cinza atual).
- Sombra: brilho azul suave por baixo + uma linha clara no topo, dando elevação.
- Card "Mais popular": continua exatamente igual — borda laranja e etiqueta em cima.
- Modo claro: nada muda, permanece a Opção C já aprovada (branco com sombra elevada).

## Onde

- `src/pages/Plans.jsx` — classes do `<article>` de cada plano.
- `src/components/admin/ManagePlansAdmin.jsx` — mesma aparência na prévia dos cards do admin.

## Detalhes técnicos

Adicionar variantes `dark:` nas classes do card: `dark:bg-gradient-to-b dark:from-[hsl(212_46%_18%)] dark:to-[hsl(212_50%_15%)]`, `dark:border-[hsl(205_40%_34%)]` (mantendo `border-accent` no destaque) e `dark:shadow-[0_26px_55px_-24px_hsl(var(--primary)/0.45),inset_0_1px_0_hsl(0_0%_100%/0.08)]`, preservando o hover de elevação e a animação de entrada.
