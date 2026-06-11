## Bug

`src/pages/Login.jsx` (linha 23) chama:
```js
await base44.auth.loginViaEmailPassword(email, password);
```
mas o mock em `src/api/base44Client.js` (linha 191) assina:
```js
async loginViaEmailPassword({ email }) { ... }
```
Como `email` é uma string, a desestruturação devolve `undefined`, o usuário é criado sem e-mail e o login efetivamente não funciona.

O mesmo padrão precisa ser conferido em `Register.jsx`, `ForgotPassword.jsx` e `ResetPassword.jsx`.

## Correção

Padronizar o mock para aceitar **as duas formas** (objeto OU positional), que é o jeito mais seguro:

```js
async loginViaEmailPassword(arg1, arg2) {
  const email = typeof arg1 === 'string' ? arg1 : arg1?.email;
  // ...
}
```

Aplicar o mesmo em `register`, `resetPasswordRequest`, `resetPassword`.

## Bônus — auto-login como admin (opcional, já que você ainda não respondeu)

Vou também semear uma sessão de admin (`admin@praiana.app`) no `localStorage` na primeira carga, pra você ver direto todas as telas sem precisar logar. Login manual continua funcionando (e o logout limpa tudo).

## Arquivos alterados

- `src/api/base44Client.js` — aceitar string ou objeto nas funções de auth; seed de sessão admin na primeira carga.

Nenhuma tela precisa mudar.
