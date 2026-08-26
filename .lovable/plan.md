# Ícone do iPhone/Android: logo completa com fundo preto

Usar a imagem enviada (logo completa "Praiana Pole Dance" sobre fundo preto) como ícone do app na tela inicial.

## O que muda

- Gerar `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` e `favicon.png` a partir da imagem enviada, em quadrado cheio, com o fundo preto original — sem transparência, então o iOS não aplica mais o branco.
- Manter a logo centralizada e ocupando o quadrado como na imagem.
- Ajustar `background_color` do `site.webmanifest` para preto (`#000000`), combinando com o ícone na splash screen.

## Observação

Como a arte tem o nome escrito, em tamanhos pequenos (favicon da aba do navegador) o texto fica pouco legível. Se preferir, posso manter na aba do navegador só a bolinha do pôr do sol e usar a arte completa apenas no ícone da tela inicial — é só avisar.

## Detalhes técnicos

- Fonte: `user-uploads://652EC485-969F-48D1-B481-A36F9D598585_1_105_c.jpeg`.
- ImageMagick: resize quadrado nos tamanhos alvo, sem alpha (fundo preto sólido).
- `src/routes/__root.tsx` já referencia esses arquivos — sem mudança.
- Nenhuma alteração em telas ou lógica do app.
