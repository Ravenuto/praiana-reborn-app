# Gerenciar alunas diretamente em Horários

## O que será feito

- Em **Admin > Horários**, cada aula do dia terá uma área para visualizar as alunas confirmadas.
- Adicionar um botão **Adicionar aluna** em cada aula, com duas opções:
  - **Aluna cadastrada:** pesquisar/selecionar uma aluna ativa.
  - **Sem cadastro:** digitar o nome e escolher entre **Experimental** ou **Avulsa**.
- Mostrar o tipo “Experimental” ou “Avulsa” ao lado do nome na lista da aula.
- Permitir retirar uma aluna da aula com confirmação antes da exclusão.

## Regras de créditos e vagas

- Ao adicionar uma aluna cadastrada, descontar 1 crédito e impedir reserva duplicada na mesma aula.
- Ao retirar manualmente uma aluna cadastrada, devolver 1 crédito.
- Experimental e avulsa ocupam vaga, mas não alteram créditos.
- Respeitar o limite de vagas da aula; quando houver fila de espera, a retirada libera a vaga para a próxima aluna conforme a regra já existente.
- Atualizar imediatamente a quantidade de vagas e a lista exibida em Horários, Reservas e Presenças.

## Ajuste de consistência

- Reaproveitar a mesma lógica de inclusão e retirada manual nas telas administrativas que manipulam reservas, evitando diferenças no controle de créditos.
- Manter os dados no formato atual de reservas, acrescentando apenas a identificação do tipo de participante quando necessário; não é necessária uma nova tabela.

## Validação

- Testar no celular e no computador: adicionar cadastrada, experimental e avulsa; impedir duplicidade/lotação; retirar; devolver crédito; e promover a fila de espera.
