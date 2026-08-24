# Ícone do site igual à logo

Hoje o ícone (`public/favicon.png`) veio de uma imagem enviada avulsa, diferente da logo que aparece no app (a logo `praiana-logo-v5`, usada na home, no login e no editor de conteúdo).

## O que será feito

- Baixar a logo oficial usada no site (a mesma da bolinha da home/login).
- Recortar/ajustar em quadrado, centralizada, com fundo transparente e uma folga leve para o desenho não encostar nas bordas.
- Gerar o novo `public/favicon.png` (256x256).
- Manter a referência do ícone no cabeçalho do site apontando para `/favicon.png`.

Resultado: a aba do navegador e o atalho na tela do celular passam a mostrar exatamente a mesma logo do app.

## Detalhes técnicos

- Fonte: `src/assets/praiana-logo.png.asset.json` (CDN).
- Processamento com ImageMagick: trim, resize proporcional e `-extent` quadrado com fundo transparente.
- `src/routes/__root.tsx` já tem `{ rel: "icon", type: "image/png", href: "/favicon.png" }` — sem mudança necessária.
- Nenhuma outra imagem ou tela do app é alterada.
