# Editor de conteúdo no Admin

Nova aba **Conteúdo** dentro do painel Admin (junto de Horários, Modalidades, Planos...) para você editar os textos e imagens das páginas **Home**, **Sobre** e **Login** — sem precisar pedir alteração de código.

## Como vai funcionar

- Aba **Conteúdo** no Admin, com três sub-abas: Home, Sobre, Login.
- Cada sub-aba lista os campos daquela página, na mesma ordem em que aparecem no site, com o rótulo do trecho (ex.: "Título principal", "Frase de apoio", "Texto do botão").
- Campos de imagem (logo, foto de fundo/destaque) com envio de arquivo e miniatura de pré-visualização.
- Botões **Salvar** e **Restaurar padrão** por página; o site passa a mostrar o texto salvo assim que você salva.
- Enquanto nada for editado, o site continua exibindo exatamente os textos atuais (eles viram os valores padrão).

## Campos editáveis

**Home**: selo/eyebrow, título, subtítulo, texto dos botões de ação, título e descrição das seções destacadas.

**Sobre**: título e subtítulo da página, texto de apresentação do estúdio, blocos de contato (endereço, telefone, e-mail, Instagram), título e subtítulo da seção Modalidades.

**Login**: título, frase de boas-vindas, textos dos botões e links, logo exibida na tela.

## Detalhes técnicos

- Os valores ficam salvos na tabela `StudioSettings` (mesmo mecanismo já usado pelas Regras do Estúdio), com chaves prefixadas por página, ex.: `content_home_title`.
- Novo módulo `src/lib/siteContent.js` com o dicionário de campos (chave, rótulo, tipo texto/textarea/imagem, valor padrão) + `getSiteContent()` com cache e `clearContentCache()` após salvar, no mesmo padrão de `src/lib/studioSettings.js`.
- Novo componente `src/components/admin/ManageSiteContent.jsx` (sub-abas e formulários) registrado como aba `content` em `AdminDashboard.jsx`.
- Upload de imagem via `base44.integrations.Core.UploadFile`, guardando a URL retornada na mesma chave de conteúdo.
- `Home.jsx`, `About.jsx` e `Login.jsx` passam a ler os textos por um hook `useSiteContent()` com fallback para os valores padrão, mantendo layout, fontes e cores atuais intactos.

## Fora do escopo desta versão

- Edição clicando direto sobre uma prévia do site (pode ser um passo seguinte).
- Edição de cores da paleta e das páginas da aluna (Agenda, Reservas, Planos, Perfil, Configurações).
