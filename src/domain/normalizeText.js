/**
 * Remove acentos, padroniza espaços e converte para minúsculas,
 * permitindo comparar textos como "José" e "jose" como equivalentes.
 */
export function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
