/**
 * AGENDAMIENTO CON CÁLCULO DINÁMICO DE DURACIÓN (núcleo de lógica, Etapa 1).
 *
 * Arma el resumen y la cita a partir de los servicios elegidos. La disponibilidad
 * se calcula con `calcularHorarios` (disponibilidad.ts), compartido con la web.
 */

import { Cita, Servicio, ServicioEnCita } from '@/types';
import { calcularDuracionTotal } from './disponibilidad';
import { aIsoNegocio } from './fechas';

export interface ResumenSeleccion {
  servicios: Servicio[];
  duracionServiciosMin: number;  // lo que ve la clienta
  duracionTotalMin: number;      // incluye preparación, lo que ocupa en agenda
  montoTotal: number;
}

export function resumirSeleccion(servicios: Servicio[]): ResumenSeleccion {
  const duracionServiciosMin = servicios.reduce((acc, s) => acc + s.duracionMin, 0);
  return {
    servicios,
    duracionServiciosMin,
    duracionTotalMin: calcularDuracionTotal(servicios),
    montoTotal: servicios.reduce((acc, s) => acc + s.precio, 0),
  };
}

/** Copia congelada de cada servicio: precio y duración tal como estaban al agendar. */
export function congelarServicios(servicios: Servicio[]): ServicioEnCita[] {
  return servicios.map((s) => ({
    servicioId: s.id,
    nombre: s.nombre,
    precio: s.precio,
    duracionMin: s.duracionMin,
  }));
}

/** Hora de fin 'HH:mm' a partir de una hora de inicio y una duración. */
export function horaFin(hora: string, duracionMin: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + duracionMin;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function construirCita(params: {
  id: string;
  clientaId: string;
  clientaNombre: string;
  servicios: Servicio[];
  fecha: string;
  hora: string;
  notas?: string;
  imagenReferenciaUri?: string;
  ahora?: Date;
}): Cita {
  const resumen = resumirSeleccion(params.servicios);
  return {
    id: params.id,
    clientaId: params.clientaId,
    clientaNombre: params.clientaNombre,
    servicios: congelarServicios(params.servicios),
    inicio: aIsoNegocio(params.fecha, params.hora),
    fin: aIsoNegocio(params.fecha, horaFin(params.hora, resumen.duracionTotalMin)),
    duracionTotalMin: resumen.duracionTotalMin,
    montoTotal: resumen.montoTotal,
    // La clienta confirma su asistencia explícitamente en el paso 3.
    estado: 'confirmada',
    notas: params.notas || undefined,
    imagenReferenciaUri: params.imagenReferenciaUri,
    creadaEn: (params.ahora ?? new Date()).toISOString(),
  };
}
