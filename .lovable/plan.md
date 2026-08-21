# Editor de conteúdo mais simples (e com as Regras do Estúdio)

## O que está confuso hoje

A aba Conteúdo é uma lista longa e plana de campos com nomes técnicos ("Título — antes da palavra laranja", "Segunda linha do título"). Sem ver a página, é difícil saber o que cada campo muda. E dá para editar o mesmo assunto em dois lugares diferentes: os números de antecedência ficam na aba Regras, e os textos das regras nem são editáveis — estão fixos no código dentro de Sobre.

## Minha sugestão

Trocar a lista plana por **blocos com pré-visualização ao lado**:

1. Escolhe a página (Home, Sobre, Login, Regras do Estúdio).
2. Dentro dela, os campos ficam agrupados em blocos com nome do que a aluna vê ("Cabeçalho", "Botões", "Contato", "Modalidades"), cada bloco recolhível.
3. Ao lado (embaixo no celular) aparece um **cartão de prévia** do bloco selecionado, atualizando enquanto você digita — assim você vê exatamente onde aquele texto entra, sem precisar entender o nome do campo.
4. Cada campo ganha uma descrição curta em linguagem simples, e o botão Salvar fica fixo no rodapé do editor mostrando quantas alterações estão pendentes.

Não vou fazer edição clicando direto no site inteiro: exigiria reescrever as páginas e costuma quebrar layout. A prévia por bloco dá o mesmo entendimento com muito menos risco.

## Regras do Estúdio (o que faltou)

Novo grupo "Regras" dentro de Conteúdo, com textos editáveis:

- Título da seção
- Bloco Agendamento e Cancelamento: título + frase (os números de horas continuam vindo da aba Regras, inseridos automaticamente no texto)
- Bloco Pontualidade: título + frase (usa os minutos de tolerância)
- Bloco Créditos: título + texto
- Bloco Fila de espera: título + texto
- Bloco Feriados: título + texto

Assim os números moram só na aba Regras (uma fonte de verdade) e a redação mora em Conteúdo.

## Detalhes técnicos

- `src/lib/siteContent.js`: campos passam a ter `section` e `help`; novo grupo `rules` com chaves `content_rules_*`; reaproveita `rule_credits` / `rule_waitlist` / `rule_holidays` já existentes em `DEFAULTS` de `studioSettings.js` como valores padrão.
- `src/components/admin/ManageSiteContent.jsx`: agrupamento por seção (accordion), painel de prévia por seção, descrições por campo, barra de salvar fixa com contagem de alterações.
- `src/components/settings/StudioRules.jsx`: passa a ler os textos via `useSiteContent()`, mantendo a substituição dos números vindos de `getStudioSettings()` (placeholders tipo `{horas}`).
- Sem mudança de banco: continua tudo em `StudioSettings` (chave/valor).
