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

  const usernamesToFetch = new Set([
    ...meta.executors,
    ...meta.creatorUsernames,
  ]);
  const emailsToFetch = new Set(meta.creatorEmails);
  const uidsToFetch = new Set(meta.creatorUids);

  if (
    usernamesToFetch.size === 0 &&
    emailsToFetch.size === 0 &&
    uidsToFetch.size === 0
  ) {
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

  await fetchByField('username', usernamesToFetch);
  await fetchByField('email', emailsToFetch);

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
    const displayName =
      normalizeValue(data.name) ||
      normalizeValue(data.username) ||
      normalizeValue(data.email) ||
      docId;
    const username = normalizeValue(data.username);
    const email = normalizeValue(data.email);

    if (username) nameByUsername.set(username, displayName);
    if (email) nameByEmail.set(email, displayName);
    nameByUid.set(docId, displayName);
  });

  return { nameByUsername, nameByEmail, nameByUid };
};
