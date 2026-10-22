/**
 * DATOS INICIALES DE LA API SIMULADA
 *
 * Parte del mismo seed de la versión web (Etapa 2) y le agrega citas futuras
 * relativas a la fecha de instalación, para que la demo siempre tenga
 * "próximas citas" y horarios ocupados que bloquear.
 */

import seedJson from './seed.json';
import { HORARIO } from '@/config';
import { construirCita, diaSemana, hoyNegocio, sumarDias } from '@/domain';
import { Cita, Insumo, Servicio, Usuaria } from '@/types';

export interface SeedData {
  usuarias: Usuaria[];
  servicios: Servicio[];
  insumos: Insumo[];
  citas: Cita[];
}

/** Contraseña de todas las cuentas de demostración (igual que en la web). */
export const PASSWORD_DEMO = 'Password123';

/** Próximo día (desde `desde`) en que el negocio abre a la hora indicada. */
function proximoDiaHabil(desde: string, hora: string): string {
  let fecha = desde;
  for (let i = 0; i < 14; i++) {
    const h = HORARIO[diaSemana(fecha) as keyof typeof HORARIO];
    if (h && hora >= h.apertura && hora < h.cierre) return fecha;
    fecha = sumarDias(fecha, 1);
  }
  return desde;
}

const clonar = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function crearSeed(ahora: Date = new Date()): SeedData {
  const base = seedJson as unknown as SeedData;
  const hoy = hoyNegocio(ahora);
  const servicio = (id: string) => base.servicios.find((s) => s.id === id)!;

  const futuras: Cita[] = [
    { id: 'cit_f1', clientaId: 'usr_1', nombre: 'Camila Pérez', srv: ['srv_3'], dias: 2, hora: '15:00' },
    { id: 'cit_f2', clientaId: 'usr_1', nombre: 'Camila Pérez', srv: ['srv_1', 'srv_4'], dias: 9, hora: '16:00' },
    { id: 'cit_f3', clientaId: 'usr_4', nombre: 'Mariana López', srv: ['srv_2'], dias: 0, hora: '15:00' },
    { id: 'cit_f4', clientaId: 'usr_5', nombre: 'Elena Castro', srv: ['srv_5'], dias: 1, hora: '16:30' },
  ].map((f) =>
    construirCita({
      id: f.id,
      clientaId: f.clientaId,
      clientaNombre: f.nombre,
      servicios: f.srv.map(servicio),
      fecha: proximoDiaHabil(sumarDias(hoy, f.dias), f.hora),
      hora: f.hora,
      ahora,
    })
  );
  // Quedan pendientes de confirmar la segunda cita de Camila y la de hoy de Mariana,
  // para mostrar ambos estados y las acciones de la administradora.
  futuras[1].estado = 'solicitada';
  futuras[2].estado = 'solicitada';

  return {
    usuarias: clonar(base.usuarias),
    servicios: clonar(base.servicios),
    insumos: clonar(base.insumos),
    citas: [...clonar(base.citas), ...futuras],
  };
}
