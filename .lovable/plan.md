# Unificar campo de WhatsApp para Home e Login

## Objetivo
Tornar o WhatsApp do studio um único campo editável: quando a administradora troca o número no editor de conteúdo, o link do rodapé da tela de login atualiza junto com o botão da Home.

## O que muda

1. **Fonte única de verdade**
   - O campo `content_home_whatsapp_url` passa a ser o único lugar onde o WhatsApp é editado.
   - O campo `content_login_signup_link_url` sai do editor (mas continua existindo como fallback temporário para não perder dados já salvos).

2. **Tela de Login**
   - O link "Entre em contato pelo WhatsApp" no rodapé passa a ler `content_home_whatsapp_url`.

3. **Editor de conteúdo (Admin)**
   - Remove o campo "Endereço do link" do bloco "Rodapé" da aba Login.
   - Adiciona texto de ajuda no campo "Link do WhatsApp" da aba Home informando que ele também alimenta o login.
   - A prévia do rodapé do login usa o WhatsApp da Home.

4. **Migração de dados existentes**
   - Se `content_home_whatsapp_url` ainda estiver com o valor padrão e existir um valor salvo em `content_login_signup_link_url`, copia o valor salvo para `content_home_whatsapp_url` automaticamente ao carregar o conteúdo.

## Arquivos envolvidos
- `src/lib/siteContent.js` — ajuste do dicionário de campos e migração de valores.
- `src/pages/Login.jsx` — usa o WhatsApp da Home no link do rodapé.
- `src/components/admin/ManageSiteContent.jsx` — remove campo do editor e atualiza prévia.
