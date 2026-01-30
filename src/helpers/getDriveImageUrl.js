// src/helpers/getDriveImageUrl.js

/**
 * Devuelve la URL pública de una imagen de Google Drive (lh3.googleusercontent.com)
 * @param {string} id - image_id de Google Drive
 * @param {number} [size=2000] - tamaño opcional (s2000 por defecto)
 * @returns {string}
 */
export function getDriveImageUrl(id, size = 2000) {
  if (!id) return '';
  return `https://lh3.googleusercontent.com/u/0/d/${id}=s${size}`;
}
