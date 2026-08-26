# Ícone do iPhone/Android: logo completa com fundo preto

Usar a arte completa "Praiana Pole Dance" com fundo preto como ícone do app (Opção A da prévia).

## O que muda

- Gerar `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` e `favicon.png` a partir da imagem enviada, em quadrado cheio, com o fundo preto original — sem transparência, então o iOS não aplica mais o branco.
- Ajustar `background_color` do `site.webmanifest` para preto, combinando com o ícone na splash screen.

## Detalhes técnicos

- Fonte: imagem enviada (arte completa 886x886, fundo preto).
- Redimensionar para os tamanhos alvo sem canal alpha (fundo preto sólido).
- `src/routes/__root.tsx` já referencia esses arquivos — sem mudança.
- Nenhuma alteração em telas ou lógica do app.
