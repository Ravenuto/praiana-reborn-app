## Diagnóstico

Só os tokens de cor/fonte não bastam — o site tem assinaturas visuais específicas que precisam virar primitivos no app:

- **Botões pill** `rounded-full px-7 py-4` com sombra azul flutuante e hover `-translate-y-0.5`
- **Headings** em `font-serif italic text-ocean` com uma palavra `text-gold` (não bold sans)
- **Eyebrow** `text-xs uppercase tracking-[0.3em] text-mist` com tracinho dourado
- **Cards** `rounded-3xl bg-white/70 backdrop-blur-xl ring-1 ring-ocean/10` com hover lift
- **Navbar flutuante** em pill com logo em badge circular
- **Blobs orgânicos** animados como fundo de toda seção principal
- **Wave dividers** entre seções
- **Marquee** de palavras italic + ✦ dourado
- **Reveal on scroll** em cards/seções

## Implementação

### 1. Reescrever primitivos shadcn (efeito global, baixo custo)

- `ui/button.jsx` — variantes:
  - `default` (ocean pill): `rounded-full bg-primary text-primary-foreground px-7 py-4 text-sm font-semibold shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.5)] hover:bg-[color:var(--brand-deep)] hover:-translate-y-0.5 transition-all`
  - `gold`: igual mas em accent
  - `outline`: `rounded-full border border-primary/30 text-primary hover:bg-primary/5`
  - `ghost`/`link` mantidos
  - sizes: `default h-12 px-7`, `sm h-9 px-4`, `lg h-14 px-9`, `icon h-10 w-10 rounded-full`
- `ui/card.jsx` — `rounded-3xl bg-card/80 backdrop-blur-xl ring-1 ring-primary/10 shadow-[0_20px_50px_-25px_hsl(var(--primary)/0.25)]`
- `ui/input.jsx` / `ui/textarea.jsx` — `rounded-full bg-white/70 ring-1 ring-primary/10` (textarea fica `rounded-3xl`)
- `ui/badge.tsx` — pill ocean/gold

### 2. Utilities CSS novas em `styles.css`

```css
.eyebrow { @apply text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--brand-mist)]; }
.h-praiana { @apply font-serif italic text-[color:var(--brand-ocean)]; }
.gold-word { @apply font-serif italic text-[color:var(--brand-gold)]; }
.surface-glass { @apply bg-white/70 backdrop-blur-xl ring-1 ring-primary/10 rounded-3xl; }
.lift-on-hover { @apply transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_hsl(var(--primary)/0.4)]; }
```

### 3. Componentes compartilhados novos

- `components/shared/PraianaBlobs.jsx` — 2-3 blobs `organic-blob` posicionados absolutos com `blur-3xl` e `animate-float-slow`
- `components/shared/WaveDivider.jsx` — SVG wave portado do site (com `animate-wave-move`)
- `components/shared/SectionHeader.jsx` — eyebrow + h2 italic ocean + descrição
- `components/shared/Marquee.jsx` — strip animada com palavras italic + ✦
- `hooks/useReveal.js` — IntersectionObserver que adiciona `.in-view` em `.reveal`

### 4. Header mobile e Navbar desktop em pill flutuante

Reescrever `mobile/MobileHeader.jsx` e `layout/Navbar.jsx` com o estilo do site:
- container `fixed top-0 inset-x-0 z-50 px-4 py-3`
- pill `bg-sand/85 backdrop-blur-xl ring-1 ring-ocean/10 shadow-[0_8px_30px_-12px_rgba(38,106,174,0.25)] rounded-[1.75rem]`
- logo em badge circular `h-11 w-11 rounded-full` com hover rotate
- nome em `font-serif italic text-ocean`
- scroll detection (ganha shadow ao rolar)
- ajustar `main` pra ter `pt-20` em vez de top-0

### 5. BottomTabs em pill flutuante

`components/mobile/BottomTabs.jsx`:
- container `fixed bottom-3 inset-x-3 z-50`
- pill `bg-sand/90 backdrop-blur-xl ring-1 ring-ocean/10 shadow-[0_8px_30px_-12px_rgba(38,106,174,0.35)] rounded-full`
- ícone ativo: círculo `bg-primary text-sand` em vez do fundo cinza
- badge de notificação em gold

### 6. Páginas: cabeçalho e blobs

Em cada página principal (Home, Schedule, Feed, Notices, Plans, Profile), aplicar template:

```jsx
<div className="relative min-h-screen">
  <PraianaBlobs />
  <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-24">
    <SectionHeader eyebrow="Sua semana" title="Aulas" goldWord="Aulas" />
    <div className="reveal">{...conteúdo existente em Card...}</div>
  </div>
</div>
```

E na **Home** especificamente: hero estilo site com h1 italic `Bem-vinda à sua jornada`, palavra dourada, dois CTAs pill (reservar / ver feed), logo flutuante em badge circular, marquee no rodapé com palavras "Força · Liberdade · Movimento".

### 7. Tela de Login

Já tem blobs — adicionar:
- h1 com `font-serif italic` e palavra "volta" em gold
- botão "Entrar" usando novo `Button` default (pill ocean com sombra)
- script "bem-vinda de volta" já está

### 8. Tema dark consistente

Verificar contraste: `.theme-light-locked` já está nos blobs/cards quando precisar travar.

## O que NÃO entra agora

- Páginas Admin profundas (ManageSessions, ManageBookings, etc.) — utilitárias, ficam com o rebrand de cores/fontes herdado mas sem hero/blob. Posso refinar depois se quiser.
- Páginas Settings/About/Notifications — só herdam os primitivos.

## Resultado esperado

Login, Home, Aulas, Feed, Recados, Planos e Perfil ficarão visualmente **gêmeas** do site: mesma navbar pill, mesmos botões, mesmos headings italic, mesmos blobs/animações. As páginas internas/admin herdam paleta e tipografia mas continuam densas/utilitárias.

## Arquivos alterados (resumo)

**Novos:** `hooks/useReveal.js`, `components/shared/PraianaBlobs.jsx`, `WaveDivider.jsx`, `SectionHeader.jsx`, `Marquee.jsx`
**Editados:** `styles.css`, `ui/button.jsx`, `ui/card.jsx`, `ui/input.jsx`, `ui/textarea.jsx`, `ui/badge.tsx`, `mobile/MobileHeader.jsx`, `mobile/BottomTabs.jsx`, `layout/Navbar.jsx`, `layout/AppLayout.jsx`, `pages/Home.jsx`, `pages/Login.jsx`, `pages/Schedule.jsx`, `pages/Feed.jsx`, `pages/Notices.jsx`, `pages/Plans.jsx`, `pages/Profile.jsx`

Pode mandar bala?
