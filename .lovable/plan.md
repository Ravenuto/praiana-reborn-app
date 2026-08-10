# Movimentos do mês por aluna

Nova área onde você (admin) monta, para cada aluna, a lista de movimentos que ela vai trabalhar no mês — com nível separado para lado direito e lado esquerdo. A aluna vê tudo numa aba nova dentro do perfil dela.

## 1. Biblioteca de movimentos (admin)

Nova aba "Movimentos" no painel admin, com duas seções:

**Biblioteca**
- Cadastrar movimento: nome, categoria e observação opcional.
- Categorias: Movimentos, Giros, Transições, Invertidas, Flexibilidade, Coreografia (editáveis na hora de cadastrar, com opção de escolher entre as existentes).
- Marcar se o movimento é bilateral (tem lado direito/esquerdo) ou único (ex.: flexibilidade, coreografia).
- Editar, excluir e busca por nome/categoria.
- Botão X para fechar o formulário, igual às outras abas.

**Plano do mês da aluna**
- Escolhe a aluna e o mês (padrão: mês atual).
- Adiciona movimentos da biblioteca ao plano dela (busca + seleção múltipla por categoria).
- Para cada movimento no plano, define o nível de cada lado: A treinar / Em progresso / Dominado (movimento único tem um nível só).
- Reordenar por arrastar, remover item, e um botão "Copiar do mês anterior".
- Campo de anotação geral do mês (foco/meta).

## 2. Aba no perfil da aluna

Dentro do perfil, aba "Meus movimentos":
- Seletor de mês (mês atual por padrão, com histórico dos meses anteriores).
- Movimentos agrupados por categoria, cada um mostrando duas barrinhas/badges: Esquerdo e Direito, coloridas pelo nível (cinza = a treinar, laranja = em progresso, azul = dominado).
- Barra de progresso do mês no topo (quantos lados já dominados).
- Anotação da professora exibida acima da lista.
- Só leitura: a aluna não edita nada.
- Se não houver plano do mês, mensagem simpática ("Sua professora ainda não montou os movimentos deste mês").

## 3. Notificação (opcional, incluída)

Quando você publica/atualiza o plano do mês de uma aluna, ela recebe uma notificação "Seus movimentos do mês estão prontos". Fica sujeito à sua aba de preferências de notificação.

## Detalhes técnicos

- Duas novas entidades no store do app (`src/api/base44Client.js`, mesmo padrão das existentes):
  - `Move`: `{ id, name, category, bilateral, notes, display_order }`
  - `StudentMovePlan`: `{ id, student_email, month (YYYY-MM), notes, items: [{ move_id, name, category, bilateral, left_level, right_level, order }], updated_date }`
  - Seed inicial com alguns movimentos de exemplo por categoria.
- Novos componentes: `src/components/admin/ManageMoves.jsx` (biblioteca) e `src/components/admin/ManageStudentMoves.jsx` (plano do mês), registrados como aba "movimentos" em `AdminDashboard.jsx`.
- Perfil: `src/components/profile/MyMoves.jsx`, renderizado numa navegação por abas simples dentro de `src/pages/Profile.jsx` ("Dados" | "Meus movimentos"), mantendo o `SectionHeader` atual.
- Reordenar usa `@hello-pangea/dnd`, já instalado para a ordenação de planos.
- Níveis via constante compartilhada (`a_treinar`, `em_progresso`, `dominado`) com cores dos tokens da paleta atual — sem cores hardcoded.
- Notificação usa o `createNotification` existente em `useNotifications.js`, com nova chave nas preferências do admin.
