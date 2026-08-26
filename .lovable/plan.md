# Ícone do iPhone: só a bolinha, sem moldura

## O que acontece hoje

O iOS não aceita ícone transparente: ele sempre desenha um quadrado com cantos arredondados. Se a imagem tem transparência, o sistema preenche com branco (era o problema anterior). Hoje o ícone está com um quadrado escuro (#0F172A) em volta da bolinha.

## Solução proposta

Ampliar a logo circular para ocupar 100% do quadrado, encostando nas bordas. Assim o recorte arredondado do iOS corta exatamente a bolinha e o resultado visual é só a logo redonda, sem moldura aparente.

- Regenerar `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` e `favicon.png` com a bolinha em sangria total (sem margem).
- Como o iOS recorta um pouco as bordas, o desenho interno da logo continua centralizado e com folga natural do próprio círculo.
- Ajustar `background_color` do `site.webmanifest` para casar com a cor predominante da logo (evita flash escuro na splash).

## Detalhes técnicos

- Fonte: logo oficial `praiana-logo-v5.png`.
- ImageMagick: recorte exato do círculo + `-resize` para 100% da tela do ícone, sem `-extent` com padding.
- Nenhuma mudança em telas ou lógica do app.
