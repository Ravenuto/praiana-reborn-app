# Ícone do site sem o quadrado branco

O ícone atual tem uma borda/fundo branco em volta da bolinha, e quando o app é adicionado à tela inicial do celular ele aparece como um quadrado branco (hoje só existe o `favicon.png`, sem ícone específico para iOS/Android).

## O que muda

1. Refazer o ícone a partir da logo oficial: recortar exatamente na bolinha, tirar o halo/borda branca e deixar o fundo transparente.
2. Criar o ícone de tela inicial (Apple touch icon, 180x180) e os ícones do manifest (192 e 512) usando a mesma bolinha, para não aparecer moldura branca no celular.
3. Registrar esses ícones no cabeçalho do site.

Resultado: na aba do navegador e na tela inicial do celular aparece só a bolinha da logo, sem quadrado branco em volta.

## Detalhes técnicos

- Gerar `public/favicon.png` (256), `public/apple-touch-icon.png` (180) e `public/icon-192.png` / `public/icon-512.png` a partir de `praiana-logo-v5.png`, com trim do branco, máscara circular e alpha limpo nas bordas.
- Criar `public/site.webmanifest` com nome "Studio Praiana Pole Dance", os ícones acima e `theme_color` da marca.
- `src/routes/__root.tsx`: adicionar os links `apple-touch-icon` e `manifest` junto do `icon` já existente.
- Nenhuma mudança em lógica ou telas do app.
