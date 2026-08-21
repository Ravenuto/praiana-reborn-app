# Acesso ao app: só você cadastra

Fecha a auto-solicitação de acesso, cria senha padrão para o primeiro login, bloqueia aluna com plano inativo e permite cadastrar outros administradores.

## 1. Só a admin cadastra

- Remove a criação automática de conta quando um e-mail desconhecido tenta entrar no login.
- Quem não estiver cadastrado por você vê: "Este e-mail não está cadastrado. Fale com o estúdio."
- Some a aba/lista de "Solicitações de Acesso" no Admin (não haverá mais pendentes) e a notificação de nova solicitação.

## 2. Senha padrão + troca no primeiro login

- Ao cadastrar uma aluna em Admin › Alunas, a conta nasce com a senha padrão `praiana` (o valor fica editável em Admin › Configurações, caso queira mudar depois).
- No primeiro login com a senha padrão, a aluna cai numa tela "Crie sua senha" (nova senha + confirmação, mínimo 6 caracteres) antes de acessar o app.
- Depois disso ela entra normalmente com a senha dela; login com senha errada é recusado.
- Você pode "Resetar senha" pelo card da aluna no Admin, voltando para a senha padrão e exigindo nova troca.

## 3. Plano inativo bloqueia o acesso

- Aluna sem plano ativo (plano inativo, vencido ou desativada por você) entra e vê a tela "Seu acesso ainda está sendo liberado" com botão de WhatsApp e Sair, sem agenda nem reservas.
- Assim que você reativa o plano no Admin, o acesso volta sozinho.
- Administradoras nunca são bloqueadas.

## 4. Cadastrar outros administradores

- Nova seção "Administradores" dentro da aba Alunas do Admin (ou aba própria "Equipe"): lista quem tem acesso admin e permite adicionar por nome + e-mail.
- Admin criado também entra com a senha padrão e troca no primeiro login.
- Seu e-mail (ravenutto@gmail.com) fica marcado como principal e não pode ser removido nem rebaixado.
- Você pode remover o acesso admin dos demais a qualquer momento.

## Detalhes técnicos

- `src/api/base44Client.js`: guardar `password_hash` simples e `must_change_password` no registro do usuário; `loginViaEmailPassword` valida senha real, recusa e-mail não cadastrado e devolve o flag de troca obrigatória; nova função `changePassword`. Manter `ADMIN_EMAIL` como admin protegido.
- `src/pages/Login.jsx`: remover mensagem de "aguardando aprovação"; após login com senha padrão, redirecionar para nova rota `/definir-senha`.
- Nova página `src/pages/SetPassword.jsx` + rota em `src/App.jsx`, protegida por sessão e obrigatória enquanto `must_change_password` for true.
- `src/components/ProtectedRoute.jsx` / `AppLayout`: renderizar `InactivePlanScreen` quando `role !== "admin"` e plano inativo/vencido; redirecionar para `/definir-senha` quando necessário.
- `src/components/admin/ManageStudents.jsx`: criar aluna já com senha padrão + `must_change_password`, botão de resetar senha, e nova seção de administradores (cria usuário com `role: "admin"`, `is_admin: true`).
- Remover `src/components/admin/StudentRequests.jsx` e sua aba em `AdminDashboard.jsx`.
- Senha padrão guardada em `StudioSettings` via `src/lib/studioSettings.js`.

Observação: o app usa um backend simulado no navegador (dados no próprio dispositivo), então a senha é validada localmente — não é criptografia de verdade. Se quiser login realmente seguro entre dispositivos, é preciso ligar o backend do Lovable Cloud depois.
