# Novo ícone do site (favicon)

Usar a logo enviada (pole dance com pôr do sol e onda azul) como ícone do site.

## O que será feito

- Recortar a imagem enviada em formato quadrado, centralizada, com padding leve para o desenho não encostar nas bordas.
- Gerar `public/favicon.png` em 512x512 (fundo transparente).
- Apontar o ícone no cabeçalho do site para esse novo arquivo e remover o `favicon.ico` antigo, para não sobrar o ícone anterior em cache/crawlers.

## Detalhes técnicos

- Processar com ImageMagick a partir de `/mnt/user-uploads/ChatGPT_Image_24_de_ago._de_2026_15_05_08.png`: trim, resize proporcional e `-extent` quadrado com fundo transparente.
- Atualizar `links` em `head()` de `src/routes/__root.tsx` para `{ rel: "icon", type: "image/png", href: "/favicon.png" }`.
- Excluir `public/favicon.ico` se ainda existir.
- Nenhuma outra logo do app é alterada nesta mudança.
