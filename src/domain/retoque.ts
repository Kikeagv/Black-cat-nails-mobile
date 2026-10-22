/**
 * FIDELIZACIÓN Y RETORNO PROGRAMADO (Etapa 1).
 *
 * Decide si la app debe invitar a la clienta a agendar su retoque, según la
 * fecha de retoque calculada al completar su última cita.
 */

import { DIAS_AVISO_RETOQUE } from '@/config';
import { Cita } from '@/types';
import { hoyNegocio, sumarDias } from './fechas';

export interface AvisoRetoque {
  mostrar: boolean;
  fechaRetoque?: string;
  vencido: boolean;
}

export function evaluarAvisoRetoque(citasClienta: Cita[], ahora: Date = new Date()): AvisoRetoque {
  const hoy = hoyNegocio(ahora);

  // Si ya tiene una cita futura activa, no hace falta recordarle nada.
  const tieneProxima = citasClienta.some(
    (c) => ['solicitada', 'confirmada'].includes(c.estado) && Date.parse(c.inicio) > ahora.getTime()
  );
  if (tieneProxima) return { mostrar: false, vencido: false };

  const ultimaCompletada = citasClienta
    .filter((c) => c.estado === 'completada' && c.fechaRetoque)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))[0];

  if (!ultimaCompletada?.fechaRetoque) return { mostrar: false, vencido: false };

  const fecha = ultimaCompletada.fechaRetoque;
  const ventana = sumarDias(hoy, DIAS_AVISO_RETOQUE);
  return {
    mostrar: fecha <= ventana,
    fechaRetoque: fecha,
    vencido: fecha < hoy,
  };
}
