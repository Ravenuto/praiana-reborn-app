
# Recriação do praiana-app na stack TanStack Start

Vou portar visualmente todas as telas e a navegação do repositório `Ravenuto/praiana-app` para este projeto, mantendo design, paleta, tipografia, layout mobile-first e fluxo de rotas idênticos. Backend Base44 (entidades, auth, reservas, planos, feed, etc.) é substituído por **dados mockados em memória** — assim a UI funciona inteira (clicar, alternar abas, abrir modais, ver listas) e depois trocamos por backend real quando você quiser.

## O que será recriado (paridade 1:1 com o repo)

Páginas (`src/routes/`):
- `/` Home
- `/login`, `/forgot-password`, `/reset-password`
- `/aulas` Schedule
- `/minhas-reservas` MyBookings
- `/feed` Feed
- `/recados` Notices
- `/perfil` Profile
- `/planos` Plans
- `/notificacoes` Notifications
- `/configuracoes` Settings
- `/sobre` About
- `/admin` AdminDashboard (com sub-abas internas: bookings, sessions, plans, students, requests, class-types, studio-settings, attendance, payment-history)

Componentes portados (mesma estrutura de pastas em `src/components/`):
- `layout/AppLayout`, `layout/Navbar`
- `mobile/BottomTabs`, `mobile/MobileHeader`
- `feed/PostCard`, `feed/NewPostForm`
- `notices/NoticesHome`, `NoticeCard`, `PollCard`, `NewPollForm`
- `profile/MyPaymentHistory`
- `schedule/SessionCard`, `DaySelector`, `CreditBanner`
- `admin/*` (todos os painéis)
- `settings/ChangePassword`, `StudioRules`
- `shared/CommentItem`, `MentionInput`, `InactivePlanScreen`

Design system (copiado verbatim do repo):
- Paleta praiana (Deep-sea `#266aae`, Sandbed, Sun-gold, etc.) convertida dos tokens HSL para `oklch` em `src/styles.css`.
- Fontes Playfair Display (heading) + Inter (body) via Google Fonts.
- `--radius: 0.75rem`, dark mode com a mesma derivação.
- Animações de página com Framer Motion (slide+fade) iguais ao `AnimatedRoute`.
- Bottom tabs mobile + Navbar desktop, com os mesmos ícones (lucide-react).

## Decisões técnicas

- **Stack**: TanStack Start + TanStack Router file-based, React 19. Cada rota do React Router vira um arquivo em `src/routes/` com `createFileRoute` (ex.: `aulas.tsx`, `admin.tsx`, `_auth.tsx` como layout para login/forgot/reset).
- **Auth mockada**: contexto `AuthContext` com usuário fake (toggle "logado / admin" no settings), `localStorage` para persistir. Sem chamadas reais.
- **Dados mockados**: módulo `src/lib/mock/*.ts` exportando arrays de sessions, bookings, plans, posts, notices, polls, students, payments, notifications. Hooks `useMockQuery` baseados em TanStack Query para simular fetch/mutate.
- **Libs SSR-sensíveis**:
  - `react-leaflet` → carregado dinamicamente client-only (não há mapa crítico no repo; só usado se aparecer em settings — caso contrário removido).
  - `react-quill` → substituído por `<textarea>` estilizada ou import client-only no `NewPostForm` (ele depende do DOM).
  - `html2canvas`, `jspdf`, `canvas-confetti`, `three` → import dinâmico só no handler que usa.
  - `framer-motion`, `recharts`, `embla`, `@hello-pangea/dnd`, `react-hook-form`, `zod`, `date-fns`, `sonner`, `lucide-react`, `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `next-themes`, `react-markdown` → instaladas normalmente.
- **Theming**: `next-themes` adaptado para TanStack (provider no `__root.tsx`), mesmas classes `dark:`.
- **404**: `PageNotFound` do repo vira `notFoundComponent` do root + cada rota com loader.
- **Toaster**: `sonner` (já vem no template) + `react-hot-toast` portado se algum componente usar.

## Estrutura de arquivos resultante

```text
src/
  routes/
    __root.tsx           (Providers: Theme, QueryClient, Auth, Toaster, Outlet)
    index.tsx            (Home)
    _auth.tsx            (layout sem AppLayout)
    _auth.login.tsx
    _auth.forgot-password.tsx
    _auth.reset-password.tsx
    _app.tsx             (AppLayout: Navbar + Outlet + BottomTabs)
    _app.index.tsx       (movido para index.tsx — alternativa: rota raiz dentro de _app)
    _app.aulas.tsx
    _app.minhas-reservas.tsx
    _app.feed.tsx
    _app.recados.tsx
    _app.admin.tsx
    _app.perfil.tsx
    _app.planos.tsx
    _app.notificacoes.tsx
    _app.configuracoes.tsx
    _app.sobre.tsx
  components/
    layout/{AppLayout,Navbar}.tsx
    mobile/{BottomTabs,MobileHeader}.tsx
    feed/, notices/, profile/, schedule/, admin/, settings/, shared/
    ui/ (shadcn — já existe no template, completo)
  lib/
    auth-context.tsx
    theme-context.tsx
    mock/{users,sessions,bookings,plans,posts,notices,polls,payments,notifications,studio-settings}.ts
    utils.ts
  styles.css             (tokens praiana em oklch + Playfair/Inter)
```

## Limitações conscientes

- Nada de backend: login aceita qualquer email/senha; reservar uma aula só atualiza estado local; admin edita mocks que somem ao recarregar (se quiser persistência rápida, uso `localStorage`).
- Funcionalidades dependentes de Base44 (envio de e-mail de reset, upload de arquivo, planos pagos com Stripe) ficam como UI funcional + `toast` "ação simulada".
- Pixel-perfect: sigo as classes Tailwind e estrutura DOM do repo; pequenas divergências podem surgir onde o Base44 SDK injetava dados (avatar do usuário, contadores) — uso valores mockados representativos.

## Próximos passos depois deste port

Quando você revisar a UI portada, podemos:
1. Ligar Lovable Cloud e criar as tabelas (User, Session, Booking, Plan, Post, Notice, Poll, Payment, Notification).
2. Trocar mocks por queries reais (TanStack Query + server functions).
3. Implementar pagamentos (Stripe) e uploads.

Confirme para eu executar o port completo de uma vez.
