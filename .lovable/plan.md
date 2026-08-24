# Data final automática + editor do e-mail de boas-vindas

## 1. Data final calculada automaticamente

Hoje a data "Válido até" já é calculada quando você cadastra a aluna ou troca o plano dela, mas ela **não** se atualiza quando você muda a data de início na tela de edição — hoje só existem os botões manuais (+30, +90, recalcular).

Mudanças:

- Ao alterar "Início do plano atual" no cadastro da aluna, a data "Válido até" é recalculada na hora, usando a duração do plano atual (mensal, trimestral, semestral, anual ou personalizada).
- Um pequeno aviso abaixo do campo mostrando a conta feita, por exemplo: "Trimestral (90 dias) — válido até 20/11/2026".
- Se você editar a data final na mão, ela passa a ser respeitada e não é sobrescrita sozinha; o botão "Recalcular pelo plano" continua disponível para voltar ao automático.
- Alunas cadastradas antes disso, que ainda não têm data final salva, passam a exibir a data calculada a partir do início do plano + duração, para não aparecer vazio.

## 2. Editor do e-mail de boas-vindas no Admin

Nova aba **"E-mails"** dentro do painel Admin, no mesmo estilo do editor de textos do site:

- Campos editáveis: assunto, saudação, corpo da mensagem, texto do botão e assinatura.
- Marcadores que você insere clicando: `{nome}`, `{email}`, `{senha}`, `{plano}`, `{link}` — substituídos automaticamente no envio.
- Pré-visualização ao lado mostrando o e-mail já montado com dados de exemplo.
- Botão "Restaurar texto padrão".
- O botão de enviar boas-vindas no cadastro da aluna passa a usar esse texto.

## Observação importante sobre o envio

O envio de e-mail hoje é apenas simulado no app (mostra "enviado", mas nada sai de verdade). Este plano cria o editor e deixa o texto pronto e salvo. Para o e-mail sair de verdade é preciso configurar um domínio de envio — posso fazer isso como um passo seguinte, se você quiser.

## Detalhes técnicos

- `ManageStudents.jsx`: recalcular `plan_end_date` no `onChange` de `plan_start_date` (via `addDaysISO` + `getDurationDays`), com flag de "editado manualmente"; fallback derivado na listagem/detalhe.
- Novo `src/lib/emailTemplates.js`: template padrão + persistência (localStorage, mesmo padrão do `siteContent.js`) e função de interpolação dos marcadores.
- Novo `src/components/admin/ManageEmails.jsx` + nova aba em `AdminDashboard.jsx`.
- `handleSendWelcomeEmail` passa a montar o corpo com o template salvo antes de chamar a função de envio.
