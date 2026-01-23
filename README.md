# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# Granban

## Firebase (Auth + Perfil)

Este projeto usa Firebase para autenticação e para armazenar dados do usuário.

### Configuração (.env)

- Copie `.env.example` para `.env` na raiz do projeto
- Preencha as variáveis `VITE_FIREBASE_*` com os valores do seu Firebase Console

### Dados do usuário

- `username` (nome de usuário)
- `email`
- `senha` (apenas no Firebase Auth)
- `photoURL` (URL da foto de perfil)

O perfil do usuário é salvo no Firestore em `users/{uid}`.
Fotos são enviados para o Firebase Storage em `users/{uid}/profile/...`.

### Serviços disponíveis

Firebase base: [src/services/firebase.js](src/services/firebase.js)

- Exporta: `db`, `auth`, `storage`

Auth/perfil: [src/services/auth.js](src/services/auth.js)

- `createAccount({ username, email, password, photoFile? })`
- `login({ email, password })`
- `logout()`
- `getCurrentUser()`
- `onAuthChange(callback)`
- `getUserProfile(uid)`
- `updateUserProfile({ uid, username?, photoFile? })`

### Exemplos de uso (para o front)

Cadastro:

```js
import { createAccount } from './services/auth';

await createAccount({
	username: 'SeuNome',
	email: 'email@exemplo.com',
	password: 'senha-forte',
	photoFile, // File (opcional)
});
```

Login:

```js
import { login } from './services/auth';

await login({ email, password });
```

Observar sessão:

```js
import { onAuthChange } from './services/auth';

const unsubscribe = onAuthChange((user) => {
	// user == null => deslogado
});

// depois: unsubscribe()
```

Atualizar username/foto:

```js
import { updateUserProfile } from './services/auth';

await updateUserProfile({ uid, username: 'NovoNome', photoFile });
```
