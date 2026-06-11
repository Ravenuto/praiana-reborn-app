## Objetivo

Sim, é totalmente possível. Vou trazer o **mesmo sistema de design** do site [Praiana Pole Studio](/projects/f8c371a9-3a32-4f48-a92a-fe0b159297a1) para este app, mantendo toda a funcionalidade e estrutura de telas existentes — muda só a "pele" (cores, fontes, formas, animações).

## O que vem do outro projeto

**Paleta de marca Praiana** (em vez do atual cinza-azulado genérico):
- `--brand-ocean` `#266aae` — azul principal
- `--brand-mist` `#5B8DB8` — azul claro
- `--brand-gold` `#F5A623` — dourado (CTAs, destaques)
- `--brand-sand` `#FAF7F2` — fundo creme
- `--brand-ink` `#1e4266` — texto
- `--brand-deep` `#11355c` — profundidade
- Versão dark com sand → `#0b1a2b` e ocean clareado

**Tipografia:**
- `Cormorant Garamond` — títulos/heading (serif elegante, no lugar do Playfair)
- `Inter` — corpo
- `Petit Formal Script` — toque manuscrito (assinatura, badges)

**Formas e animações:** classes `wave-top`, `wave-bottom`, `organic-blob`, `animate-float-slow`, `animate-float-y`, `animate-fade-up`, `animate-blob-morph`, `animate-shimmer-bg`, `animate-marquee`, `animate-wave-move`, `reveal`/`in-view`, `pulse-ring` (WhatsApp), `animate-spin-slow` — todas com `prefers-reduced-motion` respeitado.

**Truque `theme-light-locked`** — força modo claro em cards específicos mesmo no dark mode (útil pra cards de plano/recados).

## O que muda neste app

### 1. `src/styles.css`
Substituir os tokens atuais pelo bloco do site: `@theme inline` com `--color-ocean/mist/gold/sand/ink/deep` + `--font-serif/sans/script`, `:root` com os valores brand, `.dark` com os overrides, todas as keyframes/utilities decorativas, `@layer base` com `body { background: sand; color: ink; font-family: sans }`. Mantém os tokens shadcn (background/foreground/primary/etc.) mas re-mapeados para a paleta Praiana — `--primary` vira ocean, `--accent` vira gold, `--background` vira sand etc.

### 2. `src/routes/__root.tsx`
Trocar o `<link>` do Google Fonts: adicionar **Cormorant Garamond** (400/500/600/700) e **Petit Formal Script**, manter Inter, remover Playfair Display.

### 3. Reaplicar tipografia onde está hard-coded
Buscar `font-heading`, `Playfair`, `font-serif` nas páginas/componentes e garantir que apontem para o novo `--font-serif` (Cormorant). Componentes shadcn pegam automático via tokens.

### 4. Toques visuais nas telas-chave
Aplicar o "tempero" Praiana sem mexer em lógica:
- **Login**: blob orgânico animado de fundo, título em Cormorant, botão dourado
- **Home / Aulas / Feed / Recados**: header com onda decorativa (`wave-bottom`), reveal-on-scroll nos cards
- **BottomTabs / Navbar**: ícone ativo em ocean, badge em gold
- **Admin**: mantém denso, mas KPIs em cards `theme-light-locked` com acento dourado
- **Botões primários**: ocean; **CTAs de ação positiva** (reservar, confirmar pagamento): gold

### 5. Logo
Trocar a URL atual (`media.base44.com/...Logo_PRAIANA.png`) pela logo do projeto Praiana Pole Studio (vou copiar do outro projeto via cross-project asset) e usar nos cabeçalhos.

## O que NÃO muda

- Estrutura de rotas, mock backend, AuthContext, ProtectedRoute, auto-login admin — tudo permanece.
- Componentes shadcn permanecem (só herdam novas cores via tokens).
- Layouts mobile-first, BottomTabs, Navbar continuam onde estão.

## Limitações honestas

- Não é um redesign visual radical de cada tela — é **rebrand + harmonização** com o sistema do site. Se quiser que eu reimagine *layouts* (ex: home tipo landing page com hero, marquee, depoimentos), me avise que abro essa frente separadamente.
- Algumas telas do app (Admin, Configurações) são utilitárias e vão ficar discretas mesmo após o rebrand — não cabe blob animado lá.

## Quer que eu já implemente assim, ou prefere ajustar algo antes?
