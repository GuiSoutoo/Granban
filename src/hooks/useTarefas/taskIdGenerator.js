import { getDocs } from 'firebase/firestore';
import { normalizeValue } from './taskUtils';

export const deriveTaskPrefix = (nameSource, idSource) => {
  const fallback = 'TAS';
  const rawName = normalizeValue(nameSource);

  if (rawName) {
    const asciiName = rawName.normalize
      ? rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : rawName;
    const condensed = asciiName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (condensed) {
      return condensed.length >= 3 ? condensed.slice(0, 3) : (condensed + 'XXX').slice(0, 3);
    }
  }

  const rawId = normalizeValue(idSource);
  const asciiId = rawId.normalize
    ? rawId.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : rawId;
  const fallbackId = asciiId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (fallbackId) {
    return fallbackId.length >= 3 ? fallbackId.slice(0, 3) : (fallbackId + 'XXX').slice(0, 3);
  }

  return fallback;
};

export const computeNextTaskId = async (tarefasRef, prefix) => {
  try {
    const snapshot = await getDocs(tarefasRef);
    const totalDocs = snapshot.size;
    let highest = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const existing = normalizeValue(data?.TaskId).toUpperCase();
      if (existing.startsWith(prefix)) {
        const suffix = existing.slice(prefix.length);
        const parsed = parseInt(suffix, 10);
        if (!Number.isNaN(parsed) && parsed > highest) {
          highest = parsed;
        }
      }
    });

    const nextNumber = highest > 0 ? highest + 1 : totalDocs + 1;
    return `${prefix}${String(nextNumber).padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao calcular TaskId:', error);
    const fallbackSuffix = String(Date.now()).slice(-2);
    return `${prefix}${fallbackSuffix}`;
  }
};
