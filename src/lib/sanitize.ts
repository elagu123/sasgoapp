// Archivo: src/lib/sanitize.ts
// Propósito: Provee una función de sanitización para prevenir ataques XSS.

const entityMap: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Sanitiza una cadena de texto escapando caracteres HTML para prevenir ataques XSS.
 * @param str La cadena a sanitizar.
 * @returns La cadena sanitizada.
 */
export function sanitize(str: string | undefined | null): string {
  if (!str) return '';
  return String(str).replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
}
