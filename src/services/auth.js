import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  deleteField,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const USERNAMES_COLLECTION = 'usernames';

function withTimeout(promise, ms, message) {
  if (!ms) return promise;
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message || 'Operação expirou')), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function userDocRef(uid) {
  return doc(db, USERS_COLLECTION, uid);
}

function usernameDocRef(usernameLower) {
  return doc(db, USERNAMES_COLLECTION, usernameLower);
}

function normalizeUsername(username) {
  const value = (username || '').trim();
  return value ? value.toLowerCase() : '';
}

async function ensureUserDoc(user, extras = {}) {
  if (!user?.uid) return;

  const refDoc = userDocRef(user.uid);
  const snap = await getDoc(refDoc);

  const existing = snap.exists() ? snap.data() : null;
  const nameCandidate = (typeof extras.name === 'string' && extras.name.trim())
    ? extras.name.trim()
    : (user.displayName || existing?.name || null);
  const usernameCandidate = (typeof extras.username === 'string' && extras.username.trim())
    ? extras.username.trim()
    : (existing?.username || null);

  const base = {
    uid: user.uid,
    email: user.email || null,
    // Compatível com coleção existente ("name") e também mantém "username".
    name: nameCandidate,
    username: usernameCandidate,
    // Não persistimos usernameLower: a normalização é feita no JS.
    usernameLower: deleteField(),
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(refDoc, { ...base, createdAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(refDoc, base, { merge: true });
  }
}

async function reserveUsername(user, username) {
  if (!user?.uid) throw new Error('Usuário não autenticado');

  const rawUsername = (username || '').trim();
  const usernameLower = normalizeUsername(rawUsername);
  if (!rawUsername) throw new Error('username é obrigatório');
  if (!usernameLower) throw new Error('username é obrigatório');

  const ref = usernameDocRef(usernameLower);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) throw new Error('Nome de usuário já está em uso');

    tx.set(ref, {
      uid: user.uid,
      email: user.email || null,
      username: rawUsername,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

async function findEmailByUsername(username) {
  const raw = (username || '').trim();
  const lower = normalizeUsername(raw);
  if (!lower) return null;

  const snap = await getDoc(usernameDocRef(lower));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data?.email || null;
}

/**
 * Valida a força da senha.
 * @param {string} password 
 * @returns {boolean}
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 6) {
    return false;
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasLetter && hasNumber;
}

/**
 * Cria conta no Firebase Auth + salva perfil no Firestore.
 * @param {{ name: string, username: string, email: string, password: string }} input
 */
export async function createAccount(input) {
  const { name, username, email, password } = input || {};

  if (!name) throw new Error('name é obrigatório');
  if (!username) throw new Error('username é obrigatório');
  if (!email) throw new Error('email é obrigatório');
  if (!password) throw new Error('password é obrigatório');
  
  // Validação de senha no backend
  if (!validatePasswordStrength(password)) {
    throw new Error('A senha deve ter pelo menos 6 caracteres, incluindo letras e números');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  try {
    // Reserva o username (para permitir login por username).
    // Importante: isso exige regras no Firestore permitindo create em /usernames/{usernameLower}.
    await withTimeout(reserveUsername(user, username), 15000, 'Reserva de username demorou demais');
  } catch (err) {
    // Se não conseguir reservar (duplicado/permissão), desfaz a criação do usuário.
    try {
      await deleteUser(user);
    } catch {
      // ignore
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    throw err;
  }

  try {
    await updateProfile(user, {
      displayName: String(name).trim(),
    });
  } catch {
    // Best-effort
  }

  try {
    // Salva perfil no Firestore (NUNCA salvar senha aqui).
    await withTimeout(
      ensureUserDoc(user, { name: String(name).trim(), username: String(username).trim() }),
      15000,
      'Firestore demorou demais'
    );
  } catch {
    // Best-effort: não trava o cadastro se Firestore falhar.
  }

  return user;
}

/**
 * Login via email OU username + senha.
 * @param {{ identifier: string, password: string }} input
 */
export async function login(input) {
  const { identifier, password } = input || {};
  if (!identifier) throw new Error('identifier é obrigatório');
  if (!password) throw new Error('password é obrigatório');

  const raw = String(identifier).trim();
  const email = raw.includes('@') ? raw : await withTimeout(findEmailByUsername(raw), 15000, 'Busca de usuário demorou demais');
  if (!email) throw new Error('Usuário ou senha incorretos');

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    // Best-effort: garante doc em users/{uid}, mas não impede login se Firestore estiver bloqueado.
    try {
      await withTimeout(ensureUserDoc(credential.user), 15000, 'Firestore demorou demais');
    } catch {
      // ignore
    }
    return credential.user;
  } catch (err) {
    // Interpreta erros do Firebase Auth
    const errorCode = err?.code || '';
    
    if (
      errorCode === 'auth/user-not-found' ||
      errorCode === 'auth/wrong-password' ||
      errorCode === 'auth/invalid-credential' ||
      errorCode === 'auth/invalid-email'
    ) {
      throw new Error('Usuário ou senha incorretos');
    }
    
    if (errorCode === 'auth/too-many-requests') {
      throw new Error('Muitas tentativas de login. Tente novamente mais tarde');
    }
    
    if (errorCode === 'auth/user-disabled') {
      throw new Error('Esta conta foi desativada');
    }
    
    // Erro genérico para outros casos
    throw new Error(err?.message || 'Erro ao fazer login');
  }
}

export async function logout() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Observa mudanças de auth (use no front pra manter sessão).
 * @param {(user: import('firebase/auth').User|null) => void} callback
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Busca o perfil salvo no Firestore.
 */
export async function getUserProfile(uid) {
  if (!uid) throw new Error('uid é obrigatório');
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Atualiza username (Auth + Firestore). Email/senha ficam no Auth.
 * @param {{ uid: string, username?: string }} input
 */
export async function updateUserProfile(input) {
  const { uid, username } = input || {};
  if (!uid) throw new Error('uid é obrigatório');

  const updates = {};

  if (typeof username === 'string' && username.trim()) {
    updates.username = username.trim();
  }

  if (Object.keys(updates).length === 0) return;

  updates.updatedAt = serverTimestamp();
  await updateDoc(userDocRef(uid), updates);

  // Se o usuário logado for o mesmo, sincroniza com Auth profile também.
  const current = auth.currentUser;
  if (current && current.uid === uid) {
    await updateProfile(current, {
      displayName: updates.username ?? current.displayName ?? undefined,
    });
  }
}

/**
 * Atualiza foto do usuário (Firestore + Auth profile).
 * @param {{ uid: string, photoURL: string, photoPath?: string }} input
 */
export async function updateUserPhoto(input) {
  const { uid, photoURL, photoPath } = input || {};
  if (!uid) throw new Error('uid é obrigatório');
  if (!photoURL) throw new Error('photoURL é obrigatório');

  const updates = {
    photoURL,
    updatedAt: serverTimestamp(),
  };
  if (typeof photoPath === 'string' && photoPath.trim()) {
    updates.photoPath = photoPath.trim();
  }

  await updateDoc(userDocRef(uid), updates);

  const current = auth.currentUser;
  if (current && current.uid === uid) {
    try {
      await updateProfile(current, { photoURL });
    } catch {
      // best-effort
    }
  }
}

export const authBackend = {
  createAccount,
  login,
  logout,
  getCurrentUser,
  onAuthChange,
  getUserProfile,
  updateUserProfile,
  updateUserPhoto,
};
