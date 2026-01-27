import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function safeFilename(name) {
  return String(name || 'image')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 80);
}

export function validateImageFile(file) {
  if (!file) throw new Error('Arquivo inválido');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Envie um arquivo de imagem (png, jpg, webp, etc.).');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Imagem muito grande. Limite: 5MB.');
  }
}

export async function uploadImageToStorage({ path, file }) {
  validateImageFile(file);

  const fullPath = String(path || '').trim();
  if (!fullPath) throw new Error('Caminho de upload inválido');

  const storageRef = ref(storage, fullPath);
  const metadata = { contentType: file.type || undefined };

  await uploadBytes(storageRef, file, metadata);
  const url = await getDownloadURL(storageRef);

  return { url, fullPath };
}

export async function uploadUserAvatar({ uid, file }) {
  if (!uid) throw new Error('uid é obrigatório');
  const filename = safeFilename(file?.name);
  const path = `avatars/${uid}/${Date.now()}-${filename}`;
  return uploadImageToStorage({ path, file });
}

export async function uploadProjectCover({ projectId, file }) {
  if (!projectId) throw new Error('projectId é obrigatório');
  const filename = safeFilename(file?.name);
  const path = `project-covers/${projectId}/${Date.now()}-${filename}`;
  return uploadImageToStorage({ path, file });
}
