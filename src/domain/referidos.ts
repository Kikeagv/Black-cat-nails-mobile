/**
 * MÓDULO DE REFERIDOS (Etapa 1, "Galería de Diseños y Módulos de Apoyo").
 *
 * Cada clienta recibe un código propio. Al registrarse con el código de otra,
 * queda asociada para medir el canal de captación por recomendación.
 */

import { Usuaria } from '@/types';

/** Normaliza el primer nombre (sin tildes) y le agrega el año: 'Camila Pérez' → 'CAMI2026'. */
export function generarCodigoReferido(
  nombre: string,
  existentes: string[],
  anio: number = new Date().getFullYear()
): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, 'X');

  let codigo = `${base}${anio}`;
  let sufijo = 0;
  // Si el código ya existe se cambia la última letra hasta encontrar uno libre.
  while (existentes.includes(codigo)) {
    sufijo += 1;
    codigo = `${base.slice(0, 3)}${String.fromCharCode(65 + (sufijo % 26))}${anio}`;
  }
  return codigo;
}

/** Cantidad de clientas que se registraron con el código de la usuaria. */
export function contarReferidas(usuaria: Usuaria, todas: Usuaria[]): number {
  return todas.filter((u) => u.referidaPor === usuaria.codigoReferido).length;
}

export const DESCUENTO_REFERIDO = 0.2; // 20 % en el próximo servicio para ambas
