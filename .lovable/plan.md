# Convite por e-mail para criar a senha

Ao cadastrar uma aluna, você informa os dados como hoje, sem definir nem repassar senha. Ela recebe um convite para abrir o app e criar a própria senha.

## O que muda

- O cadastro de novas alunas enviará um convite ao e-mail informado. A confirmação na tela dirá se o convite foi enviado; nenhum código ou senha será mostrado à administradora.
- O link abrirá uma página pública do app para criar e confirmar a senha. Depois de salvar, a aluna poderá entrar com e-mail e essa senha; as regras atuais de acesso por plano continuam valendo.
- Na ficha de uma aluna já cadastrada, a ação de redefinir senha enviará um link por e-mail, sem trocar a senha silenciosamente nem exibir uma senha temporária. Se o link expirar, será possível pedir outro.
- Administradoras e professoras novas também seguirão o mesmo fluxo de convite, para que o cadastro não tenha dois métodos diferentes de primeiro acesso. Conceder uma função a alguém que já tem conta não mudará sua senha.
- Falhas de envio terão mensagem clara e caminho de reenvio, sem indicar que a pessoa já pode entrar quando o convite não foi entregue.

## E-mails e domínio

O envio de e-mails com links de acesso pode começar pelo remetente padrão do serviço de autenticação. O domínio do site já está conectado, mas ainda **não** há um domínio de envio de e-mails configurado; personalizar o remetente com a marca do estúdio é uma configuração separada e não bloqueará o convite inicial. Links apontarão para o endereço público do app, não para o endereço temporário de prévia.

## Detalhes técnicos

- Substituir a geração de senhas temporárias no cadastro pela função administrativa de convite do provedor de autenticação, protegida pela verificação de administradora. Registrar perfil e função do usuário criado sem permitir autoinscrição.
- Garantir que o retorno do convite seja aceito em uma página pública antes da autenticação completa; processar os formatos de link de convite/recuperação com estados de carregamento, inválido e expirado. Só liberar as páginas protegidas depois de criada a senha.
- Trocar o reset administrativo por envio de recuperação ao e-mail cadastrado; não redefinir credenciais de terceiros sem confirmação no link. Ajustar rótulos, mensagens e botões de reenvio no Admin.
- Testar cadastro, convite, criação da senha, login, reenvio e recuperação sem expor links ou tokens nos registros. Conferir também o fluxo em celular e a resposta real do envio antes de declarar que funciona.
