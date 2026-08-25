# Limpar opções de notificação do admin

Na aba **Admin > Notificações** aparecem sete opções, mas metade não faz sentido para o controle do estúdio. A Raissa quer manter só as notificações sobre aulas.

## O que será feito

- Remover do editor de preferências (`src/lib/adminNotifPrefs.js`) os tipos que não existem ou não interessam ao dia a dia do estúdio:
  - Curtidas
  - Comentários
  - Novas publicações
  - Pagamentos e créditos
- Manter apenas:
  - Novas reservas
  - Cancelamentos
  - Fila de espera
- Ajustar `src/hooks/useNotifications.js` para que as notificações antigas que ainda forem geradas (curtidas/comentários/novos posts/pagamentos) não sejam bloqueadas por preferência inexistente — elas simplesmente continuarão a ser criadas normalmente, já que a Raissa não quer controlar isso por ali.
- Garantir que o salvamento das preferências continue funcionando com os três tipos restantes.

## Detalhes técnicos

- `ADMIN_NOTIF_TYPES` passa a ter 3 itens.
- `DEFAULT_PREFS` é recalculado a partir dessa lista reduzida.
- As chamadas diretas a `base44.entities.Notification.create` em `PostCard`, `NoticeCard`, `NewPostForm` e `PaymentHistoryDialog` não precisam de alteração.
- O componente `ManageNotifPrefs.jsx` continua renderizando dinamicamente a lista, então ajusta-se automaticamente.
