# Professora não aparece na lista

## O que está acontecendo

O acesso de professora **foi salvo com sucesso**. No banco, sua conta (ravenutto@gmail.com) já tem os dois papéis: `admin` e `teacher`.

O problema é só na exibição: a lista "Professores" no painel admin esconde qualquer conta que também seja administradora. Como você é a admin principal, seu nome nunca aparece ali — mesmo tendo o acesso de professora ativo.

## O ajuste

Em Cadastros › Professores:

- Mostrar também as contas que são admin **e** professora.
- Marcar essas contas com uma etiqueta discreta "Admin" no card, para ficar claro que é a mesma pessoa com os dois acessos.
- Manter a lista de alunas como está (sem admins e sem professoras).
- No botão de remover dessas contas duplas, remover **apenas o acesso de professora**, sem apagar a conta de administradora.

## Detalhe técnico

Em `src/components/admin/ManageStudents.jsx`:

- Linha ~103: o filtro `teachers` exclui `role === "admin"`. Passar a incluir qualquer usuário com `is_teacher === true` ou `role === "teacher"`.
- `handleRemoveTeacher`: quando o usuário também for admin, chamar `User.update(id, { role: "admin", is_teacher: false })` em vez de `User.delete(id)`.
