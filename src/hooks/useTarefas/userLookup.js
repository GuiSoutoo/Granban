import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { chunkArray, normalizeValue } from './taskUtils';

export const resolveUserMaps = async (meta) => {
  const nameByUsername = new Map();
  const nameByEmail = new Map();
  const nameByUid = new Map();

  if (!meta) {
    return { nameByUsername, nameByEmail, nameByUid };
  }

  // Executores são usernames que precisamos buscar
  const usernamesToFetch = new Set(meta.executors || []);
  const uidsToFetch = new Set(meta.creatorUids || []);

  if (usernamesToFetch.size === 0 && uidsToFetch.size === 0) {
    return { nameByUsername, nameByEmail, nameByUid };
  }

  const usersCol = collection(db, 'users');
  const seenDocs = new Map();

  const pushDoc = (docSnap) => {
    if (!docSnap?.exists?.()) return;
    const data = docSnap.data() || {};
    seenDocs.set(docSnap.id, data);
  };

  const fetchByField = async (field, valuesSet) => {
    if (!valuesSet || valuesSet.size === 0) return;
    const values = Array.from(valuesSet).map(normalizeValue).filter(Boolean);
    if (values.length === 0) return;

    const batches = chunkArray(values, 10);
    const snaps = await Promise.all(
      batches.map((batch) => getDocs(query(usersCol, where(field, 'in', batch))))
    );

    snaps.forEach((snap) => {
      snap.forEach((docSnap) => {
        pushDoc(docSnap);
      });
    });
  };

  // Busca usuários por username (para resolver nomes de executores)
  await fetchByField('username', usernamesToFetch);

  // Busca usuários por UID (para resolver nomes de criadores, se necessário)
  if (uidsToFetch.size > 0) {
    const uidList = Array.from(uidsToFetch).map(normalizeValue).filter(Boolean);
    if (uidList.length > 0) {
      await Promise.all(
        uidList.map(async (uid) => {
          try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            pushDoc(snap);
          } catch (error) {
            console.error('Erro ao buscar usuário por UID:', error);
          }
        })
      );
    }
  }

  seenDocs.forEach((data, docId) => {
    // Prioriza o campo 'name' para nome de exibição
    const displayName =
      normalizeValue(data.name) ||
      normalizeValue(data.username) ||
      normalizeValue(data.email) ||
      docId;
    const username = normalizeValue(data.username);
    const usernameLower = username.toLowerCase();
    const email = normalizeValue(data.email);

    // Mapeia tanto o username original quanto em minúsculas para o displayName
    if (username) {
      nameByUsername.set(username, displayName);
      nameByUsername.set(usernameLower, displayName);
    }
    if (email) nameByEmail.set(email, displayName);
    nameByUid.set(docId, displayName);
  });

  return { nameByUsername, nameByEmail, nameByUid };
};
