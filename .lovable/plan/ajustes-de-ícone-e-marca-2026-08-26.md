# Ajustes de ícone e marca

## O que vamos fazer

1. **Corrigir fundo branco do ícone ao salvar no iPhone**
   - Regenerar os ícones PWA (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png` e `favicon.png`) como quadrados completos, com o fundo da cor da marca (azul marinho `#1268c4` ou degradê laranja/azul) e a logo circular centralizada.
   - iOS preenche automaticamente com branco quando a imagem tem transparência; por isso os novos ícones terão preenchimento sólido nas bordas, evitando o quadrado branco na tela inicial.
   - Ajustar `background_color` do `site.webmanifest` para a mesma cor de fundo dos ícones, mantendo a experiência uniforme na splash screen.

2. **Remover badge "Edit with Lovable" do site publicado**
   - Usar a configuração de publicação para ocultar o badge (`hide_badge: true`).
   - Essa ação requer plano Pro ou superior; se o plano atual não permitir, informarei na execução.

## Arquivos envolvidos
- `public/apple-touch-icon.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/favicon.png`
- `public/site.webmanifest`
- Configuração de publicação (badge visibility)
