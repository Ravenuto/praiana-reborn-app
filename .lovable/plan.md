# Fechar o acesso: site abre no login e só você é admin

Encontrei a causa exata. Hoje o app cria sozinho uma sessão de administradora assim que alguém abre o site (existe um trecho que "loga" automaticamente a conta `ravenutto@gmail.com` quando não há sessão salva). Por isso o link publicado cai direto no painel admin.

Além disso, todo o login e os dados de hoje ficam guardados dentro do navegador de cada pessoa — não existe servidor validando nada. Vamos resolver em duas etapas.

## Etapa 1 — Correção imediata (hoje)

- Remover a criação automática de sessão. Sem login feito, o site sempre abre em `/login`.
- Qualquer rota protegida (home, agenda, reservas, perfil, professora, admin) redireciona para o login quando não há sessão.
- A rota `/admin` só abre para conta com papel de administradora; qualquer outra pessoa é mandada para fora.
- Limpar a sessão "fantasma" já salva nos navegadores (mudança da chave de sessão), forçando um login limpo para todo mundo.
- Publicar em seguida para o link ficar seguro.

## Etapa 2 — Login e dados de verdade no servidor (Lovable Cloud)

Objetivo: senha validada no servidor, admin protegido no banco, e os mesmos dados em qualquer celular/computador.

1. **Contas e papéis**
   - Ligar a autenticação por e-mail e senha do backend.
   - Tabela `profiles` (nome, telefone, foto, plano, créditos, validade, pausa) e tabela separada `user_roles` (`admin`, `teacher`, `student`) — papel nunca fica no perfil, para evitar que alguém se promova.
   - Seu e-mail `ravenutto@gmail.com` criado como a administradora principal, protegida contra remoção/rebaixamento.
   - Cadastro público desligado: só a admin cria alunas e professoras (senha padrão + troca obrigatória no primeiro acesso continua funcionando).

2. **Dados do estúdio no banco**
   - Migrar as coleções que hoje vivem no navegador: modalidades, horários, reservas, fila de espera, planos, pagamentos, presenças, avisos/enquetes, notificações, feriados, regras do estúdio e textos do site.
   - Regras de acesso (RLS) por papel: aluna vê e mexe só no que é dela; professora vê a agenda e lança presenças; admin gerencia tudo.
   - Importação única dos dados que já estão no seu navegador, para não perder cadastros existentes.

3. **Troca da camada de acesso**
   - Substituir o cliente simulado (`src/api/base44Client.js`) por chamadas reais ao backend, mantendo a mesma interface (`list/filter/create/update/delete`) para as telas continuarem funcionando.
   - Proteção de rotas passa a usar a sessão real; painel admin também é verificado no servidor, não só na tela.

## Detalhes técnicos

- Etapa 1: remover o bloco de auto-seed da sessão em `src/api/base44Client.js` (o `if (isBrowser && !localStorage.getItem(AUTH_KEY) ...) writeAuth(admin)`), versionar `AUTH_KEY` para `..._v2`, garantir redirecionamento em `ProtectedRoute`/`AppLayout` e travar `/admin` por `isAdminUser`.
- Etapa 2: migrations com `profiles`, `user_roles` + função `has_role` (security definer), GRANTs e políticas RLS; leituras/escritas sensíveis via `createServerFn`; `AuthContext` passa a usar `supabase.auth` com `onAuthStateChange`; adaptador em `src/api/base44Client.js` mapeando entidades para tabelas.
- Migração de dados: tela única de importação que lê o `localStorage` atual e envia para o banco.

Observação: a Etapa 2 é grande e será feita por partes (contas/papéis primeiro, depois dados), publicando a cada bloco estável.
